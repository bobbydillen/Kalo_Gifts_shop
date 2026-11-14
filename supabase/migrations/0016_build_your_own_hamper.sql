-- Build-your-own hampers: a customer picks at least 3 different products, each with its own colour,
-- size and (for a photo frame) photo, and orders them as one hamper.
--
--   * products.build_your_own   marks the single "Build your own hamper" product (its name, photos
--                               and weight come from this row; switching it off hides the builder)
--   * order_items.parts         the chosen products, kept on the hamper's order line
--   * site_settings             hamper_box_fee (rupees) and hamper_discount_percent (off the items)
--
-- Price = items total - discount + box fee. The database works it out itself in place_order, taking
-- stock for every chosen product, so nothing the browser sends can change what is charged.

alter table public.products add column if not exists build_your_own boolean not null default false;
create unique index if not exists products_one_build_your_own on public.products (build_your_own) where build_your_own;

alter table public.order_items add column if not exists parts jsonb;

insert into public.site_settings (key, value) values
  ('hamper_box_fee', '99'::jsonb),
  ('hamper_discount_percent', '10'::jsonb)
on conflict (key) do nothing;

insert into public.products
  (slug, name, category, price, line, description, details, sizes, tint, active, sort, build_your_own, weight_g, length_cm, breadth_cm, height_cm)
values
  ('build-your-own-hamper', 'Build your own hamper', 'hamper', 99,
   'Choose what goes inside. Three or more gifts, packed with care.',
   'Pick any three or more gifts from our collection, choose the colours and sizes, and we pack them together in a gift box with an optional handwritten card. The more you add, the more you save.',
   array['Choose any 3 or more different gifts', 'A bundle discount on the items', 'Packed in a gift box'],
   array[]::text[], '#1B4436', true, 1, true, 500, 35, 28, 15)
on conflict (slug) do nothing;

-- Works out one hamper line: checks every chosen product, takes its stock, and returns the price.
-- Only place_order calls this; no one else can run it.
create or replace function private.build_hamper_line(p_item jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_box public.products%rowtype;
  v_fee integer;
  v_pct integer;
  v_parts jsonb;
  v_part jsonb;
  v_prod public.products%rowtype;
  v_qty integer;
  v_colour text;
  v_size text;
  v_have integer;
  v_unit integer;
  v_photo text;
  v_items_total integer := 0;
  v_weight integer := 0;
  v_out jsonb := '[]'::jsonb;
  v_slugs text[] := '{}';
  v_disc integer;
begin
  select * into v_box from public.products p where p.build_your_own and p.active limit 1;
  if not found then
    raise exception 'HAMPER_UNAVAILABLE';
  end if;

  v_fee := coalesce((select (s.value #>> '{}')::integer from public.site_settings s where s.key = 'hamper_box_fee'), 0);
  v_pct := least(greatest(coalesce((select (s.value #>> '{}')::integer from public.site_settings s where s.key = 'hamper_discount_percent'), 0), 0), 90);

  v_parts := p_item -> 'parts';
  if jsonb_typeof(v_parts) is distinct from 'array' or jsonb_array_length(v_parts) > 15 then
    raise exception 'HAMPER_BAD';
  end if;

  for v_part in select e.value from jsonb_array_elements(v_parts) as e loop
    select * into v_prod from public.products pr where pr.slug = v_part ->> 'slug' and pr.active and pr.category <> 'hamper';
    if not found then
      raise exception 'ITEM_UNAVAILABLE:%', coalesce(v_part ->> 'slug', '');
    end if;

    v_qty := (v_part ->> 'qty')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 5 then
      raise exception 'BAD_QTY:%', v_prod.name;
    end if;

    v_colour := btrim(coalesce(v_part ->> 'colour', ''));
    v_size := btrim(coalesce(v_part ->> 'size', ''));

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

    v_photo := nullif(btrim(coalesce(v_part ->> 'photo', '')), '');
    if v_prod.custom_photo then
      if v_photo is null
         or v_photo !~ '^uploads/[0-9a-f-]{36}\.(webp|jpg)$'
         or not exists (select 1 from storage.objects o where o.bucket_id = 'customer-photos' and o.name = v_photo) then
        raise exception 'PHOTO_REQUIRED:%', v_prod.name;
      end if;
    else
      v_photo := null;
    end if;

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

    v_unit := coalesce((v_prod.size_prices ->> v_size)::integer, v_prod.price);
    v_items_total := v_items_total + v_unit * v_qty;
    v_weight := v_weight + v_prod.weight_g * v_qty;
    if not (v_prod.slug = any (v_slugs)) then
      v_slugs := v_slugs || v_prod.slug;
    end if;

    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'slug', v_prod.slug, 'name', v_prod.name, 'colour', v_colour, 'size', v_size,
      'qty', v_qty, 'unit', v_unit, 'photo', v_photo));
  end loop;

  if cardinality(v_slugs) < 3 then
    raise exception 'HAMPER_TOO_SMALL';
  end if;

  v_disc := round(v_items_total * v_pct / 100.0);
  return jsonb_build_object(
    'slug', v_box.slug, 'name', v_box.name,
    'unit', v_items_total - v_disc + v_fee,
    'weight', v_weight + v_box.weight_g,
    'parts', v_out);
end;
$$;

revoke all on function private.build_hamper_line(jsonb) from public, anon, authenticated;

-- place_order: handle a hamper line, and remember its parts on the order.
do $patch$
declare
  d text := pg_get_functiondef('public.place_order(jsonb)'::regprocedure);
  n text;
begin
  n := replace(d, E'  v_photo text;\n', E'  v_photo text;\n  v_hamper jsonb;\n');
  if n = d then raise exception 'patch 1 failed'; end if;
  d := n;

  n := replace(d, E'  for v_item in select e.value from jsonb_array_elements(v_items) as e loop\n',
    E'  for v_item in select e.value from jsonb_array_elements(v_items) as e loop\n' ||
    E'    if v_item ? ''parts'' then\n' ||
    E'      v_hamper := private.build_hamper_line(v_item);\n' ||
    E'      v_weight := v_weight + (v_hamper ->> ''weight'')::integer;\n' ||
    E'      v_card := btrim(coalesce(v_item->>''note'', ''''));\n' ||
    E'      if length(v_card) > v_max_chars then\n' ||
    E'        raise exception ''CARD_TOO_LONG'';\n' ||
    E'      end if;\n' ||
    E'      v_unit := (v_hamper ->> ''unit'')::integer + case when v_card <> '''' then v_card_price else 0 end;\n' ||
    E'      v_subtotal := v_subtotal + v_unit;\n' ||
    E'      v_lines := v_lines || jsonb_build_array(jsonb_build_object(\n' ||
    E'        ''slug'', v_hamper ->> ''slug'', ''name'', v_hamper ->> ''name'', ''colour'', '''', ''size'', '''',\n' ||
    E'        ''qty'', 1, ''unit'', v_unit, ''wrap'', false, ''card'', v_card, ''photo'', null, ''parts'', v_hamper -> ''parts''));\n' ||
    E'      continue;\n' ||
    E'    end if;\n\n');
  if n = d then raise exception 'patch 2 failed'; end if;
  d := n;

  n := replace(d, E'gift_wrap, card_message, photo_path)\n  select', E'gift_wrap, card_message, photo_path, parts)\n  select');
  if n = d then raise exception 'patch 3 failed'; end if;
  d := n;

  n := replace(d, E'l->>''card'', l->>''photo''\n', E'l->>''card'', l->>''photo'', l->''parts''\n');
  if n = d then raise exception 'patch 4 failed'; end if;

  execute n;
end
$patch$;

revoke execute on function public.place_order(jsonb) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;
