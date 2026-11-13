-- Delivery cost worked out from where the parcel goes, how much it weighs and what was ordered.
--
-- Three regions: Tamil Nadu, the rest of South India, the rest of India. Each has four numbers:
-- the charge up to 500 g, up to 1 kg, up to 2 kg, and the extra charge for every further 1 kg
-- (or part of it). Orders whose items total at least `shipping_free_over` rupees ship free.
-- Both are settings the owner edits in the admin. The numbers below are starting placeholders.
--
-- The fee is calculated here, inside place_order, so a customer cannot change it in the browser.
-- src/lib/shipping.ts holds the same rules so checkout can show the fee before the order is placed.

insert into public.site_settings (key, value) values
  ('shipping_free_over', '1000'::jsonb),
  ('shipping_rates', '{"tn":[50,70,100,40],"south":[60,80,120,50],"india":[70,100,150,60]}'::jsonb)
on conflict (key) do nothing;

create or replace function private.shipping_fee(p_state text, p_weight_g integer, p_subtotal integer)
returns integer
language plpgsql
stable
set search_path = ''
as $$
declare
  v_free integer;
  v_rates jsonb;
  v_zone text;
  v_row jsonb;
  v_weight integer := greatest(p_weight_g, 1);
begin
  v_free := coalesce((select (s.value #>> '{}')::integer from public.site_settings s where s.key = 'shipping_free_over'), 1000);
  if p_subtotal >= v_free then
    return 0;
  end if;

  v_rates := coalesce(
    (select s.value from public.site_settings s where s.key = 'shipping_rates'),
    '{"tn":[50,70,100,40],"south":[60,80,120,50],"india":[70,100,150,60]}'::jsonb);

  v_zone := case
    when lower(btrim(p_state)) = 'tamil nadu' then 'tn'
    when lower(btrim(p_state)) in ('kerala', 'karnataka', 'andhra pradesh', 'telangana', 'puducherry') then 'south'
    else 'india'
  end;
  v_row := v_rates -> v_zone;

  if v_weight <= 500 then
    return (v_row ->> 0)::integer;
  elsif v_weight <= 1000 then
    return (v_row ->> 1)::integer;
  elsif v_weight <= 2000 then
    return (v_row ->> 2)::integer;
  end if;
  return (v_row ->> 2)::integer + ceil((v_weight - 2000) / 1000.0)::integer * (v_row ->> 3)::integer;
end;
$$;

grant execute on function private.shipping_fee(text, integer, integer) to anon, authenticated;

create or replace function public.place_order(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_open boolean;
  v_wrap_price integer;
  v_card_price integer;
  v_max_chars integer;
  v_fee integer;
  v_weight integer := 0;

  v_phone text;
  v_email text;
  v_name text;
  v_line1 text;
  v_line2 text;
  v_city text;
  v_state text;
  v_pin text;
  v_note text;

  v_items jsonb;
  v_item jsonb;
  v_lines jsonb := '[]'::jsonb;
  v_prod public.products%rowtype;
  v_slug text;
  v_qty integer;
  v_colour text;
  v_size text;
  v_wrap boolean;
  v_card text;
  v_have integer;
  v_unit integer;
  v_subtotal integer := 0;
  v_total integer;

  v_customer uuid;
  v_order_id uuid;
  v_number bigint;
begin
  v_open := coalesce((select (s.value #>> '{}')::boolean from public.site_settings s where s.key = 'checkout_open'), false);
  if not v_open then
    raise exception 'CHECKOUT_CLOSED';
  end if;

  v_wrap_price := coalesce((select (s.value #>> '{}')::integer from public.site_settings s where s.key = 'gift_wrap_price'), 50);
  v_card_price := coalesce((select (s.value #>> '{}')::integer from public.site_settings s where s.key = 'gift_card_price'), 50);
  v_max_chars := coalesce((select (s.value #>> '{}')::integer from public.site_settings s where s.key = 'gift_card_max_chars'), 250);

  v_phone := regexp_replace(coalesce(p->>'phone', ''), '\D', '', 'g');
  if length(v_phone) = 12 and left(v_phone, 2) = '91' then
    v_phone := substr(v_phone, 3);
  end if;
  if v_phone !~ '^[6-9][0-9]{9}$' then
    raise exception 'BAD_PHONE';
  end if;
  v_phone := '+91' || v_phone;

  -- optional; kept lowercase so it matches the email on a customer's sign-in
  v_email := lower(btrim(coalesce(p->>'email', '')));
  if v_email <> '' and (length(v_email) > 200 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then
    raise exception 'BAD_EMAIL';
  end if;

  v_name := btrim(coalesce(p->>'name', ''));
  if length(v_name) < 2 or length(v_name) > 80 then raise exception 'BAD_NAME'; end if;

  v_line1 := btrim(coalesce(p->>'line1', ''));
  v_line2 := btrim(coalesce(p->>'line2', ''));
  if length(v_line1) < 3 or length(v_line1) > 200 or length(v_line2) > 200 then raise exception 'BAD_ADDRESS'; end if;

  v_city := btrim(coalesce(p->>'city', ''));
  v_state := btrim(coalesce(p->>'state', ''));
  if length(v_city) < 2 or length(v_city) > 80 or length(v_state) < 2 or length(v_state) > 60 then
    raise exception 'BAD_ADDRESS';
  end if;

  v_pin := btrim(coalesce(p->>'pincode', ''));
  if v_pin !~ '^[1-9][0-9]{5}$' then raise exception 'BAD_PINCODE'; end if;

  v_note := left(btrim(coalesce(p->>'note', '')), 300);

  if (select count(*) from public.orders o where o.created_at > now() - interval '1 hour') >= 60 then
    raise exception 'BUSY';
  end if;
  if (select count(*)
        from public.orders o
        join public.customers c on c.id = o.customer_id
       where c.phone = v_phone and o.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'TOO_MANY';
  end if;

  v_items := p->'items';
  if jsonb_typeof(v_items) is distinct from 'array' or jsonb_array_length(v_items) not between 1 and 30 then
    raise exception 'EMPTY_BAG';
  end if;

  for v_item in select e.value from jsonb_array_elements(v_items) as e loop
    v_slug := v_item->>'slug';
    select * into v_prod from public.products pr where pr.slug = v_slug and pr.active;
    if not found then
      raise exception 'ITEM_UNAVAILABLE:%', coalesce(v_slug, '');
    end if;

    v_qty := (v_item->>'qty')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 10 then
      raise exception 'BAD_QTY:%', v_prod.name;
    end if;
    v_weight := v_weight + v_prod.weight_g * v_qty;

    v_colour := btrim(coalesce(v_item->>'colour', ''));
    v_size := btrim(coalesce(v_item->>'size', ''));

    if exists (select 1 from public.product_colours c where c.product_id = v_prod.id) then
      if not exists (select 1 from public.product_colours c where c.product_id = v_prod.id and c.name = v_colour) then
        raise exception 'BAD_OPTION:%', v_prod.name;
      end if;
    elsif v_colour <> '' then
      raise exception 'BAD_OPTION:%', v_prod.name;
    end if;

    if cardinality(v_prod.sizes) > 0 then
      if not (v_size = any (v_prod.sizes)) then
        raise exception 'BAD_OPTION:%', v_prod.name;
      end if;
    elsif v_size <> '' then
      raise exception 'BAD_OPTION:%', v_prod.name;
    end if;

    v_wrap := coalesce((v_item->>'wrap')::boolean, false) and v_prod.category <> 'hamper';
    v_card := btrim(coalesce(v_item->>'note', ''));
    if length(v_card) > v_max_chars then
      raise exception 'CARD_TOO_LONG';
    end if;

    if v_prod.category <> 'hamper' then
      select s.qty into v_have
        from public.stock s
       where s.product_id = v_prod.id and s.colour = v_colour and s.size = v_size
         for update;
      if found then
        if v_have < v_qty then
          raise exception 'OUT_OF_STOCK:%', v_prod.name;
        end if;
        update public.stock s
           set qty = s.qty - v_qty
         where s.product_id = v_prod.id and s.colour = v_colour and s.size = v_size;
      end if;
    end if;

    v_unit := v_prod.price
              + case when v_wrap then v_wrap_price else 0 end
              + case when v_card <> '' then v_card_price else 0 end;
    v_subtotal := v_subtotal + v_unit * v_qty;

    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'slug', v_prod.slug, 'name', v_prod.name, 'colour', v_colour, 'size', v_size,
      'qty', v_qty, 'unit', v_unit, 'wrap', v_wrap, 'card', v_card));
  end loop;

  v_fee := private.shipping_fee(v_state, v_weight, v_subtotal);
  v_total := v_subtotal + v_fee;

  if (p->>'expected_total') is not null and (p->>'expected_total')::integer <> v_total then
    raise exception 'PRICE_CHANGED:%', v_total;
  end if;

  insert into public.customers (phone, name)
  values (v_phone, v_name)
  on conflict (phone) do update
    set last_seen_at = now(),
        name = case when public.customers.name = '' then excluded.name else public.customers.name end
  returning id into v_customer;

  insert into public.addresses (customer_id, full_name, phone, line1, line2, city, state, pincode, is_default)
  select v_customer, v_name, v_phone, v_line1, v_line2, v_city, v_state, v_pin,
         not exists (select 1 from public.addresses a where a.customer_id = v_customer)
   where not exists (
     select 1 from public.addresses a
      where a.customer_id = v_customer and a.line1 = v_line1 and a.pincode = v_pin);

  insert into public.orders
    (customer_id, customer_email, subtotal, delivery_fee, total, ship_name, ship_phone,
     ship_line1, ship_line2, ship_city, ship_state, ship_pincode, customer_note)
  values
    (v_customer, nullif(v_email, ''), v_subtotal, v_fee, v_total, v_name, v_phone,
     v_line1, v_line2, v_city, v_state, v_pin, v_note)
  returning id, number into v_order_id, v_number;

  insert into public.order_items
    (order_id, product_slug, product_name, colour, size, qty, unit_price, gift_wrap, card_message)
  select v_order_id, l->>'slug', l->>'name', l->>'colour', l->>'size',
         (l->>'qty')::integer, (l->>'unit')::integer, (l->>'wrap')::boolean, l->>'card'
    from jsonb_array_elements(v_lines) as t(l);

  insert into public.order_events (order_id, status, note)
  values (v_order_id, 'new', 'Order placed on the website');

  return jsonb_build_object('number', v_number, 'total', v_total);
end;
$$;

revoke execute on function public.place_order(jsonb) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;
