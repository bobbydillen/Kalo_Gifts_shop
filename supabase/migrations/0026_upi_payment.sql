-- Pay by UPI, straight into the shop's own UPI ID (no payment gateway).
-- The order is placed first (so stock is held), then the customer pays the exact amount from their
-- UPI app and sends the UPI reference (UTR). The order's payment stays "pending" until the shop sees
-- the money in the bank and marks it received in the admin (payment_status = 'paid').

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check check (payment_method in ('prepaid', 'cod', 'test', 'upi'));

alter table public.orders add column if not exists payment_ref text;

-- place_order: accept "upi" as a payment choice (no extra limits, unlike cash on delivery)
do $patch$
declare d text;
begin
  d := pg_get_functiondef('public.place_order(jsonb)'::regprocedure);
  if position($q$'cod', 'test', 'upi'$q$ in d) > 0 then return; end if;
  d := replace(d, $q$v_payment not in ('cod', 'test')$q$, $q$v_payment not in ('cod', 'test', 'upi')$q$);
  if position($q$'cod', 'test', 'upi'$q$ in d) = 0 then raise exception 'patch did not apply'; end if;
  execute d;
end
$patch$;

-- The customer sends the UPI reference for their own order: the phone number on the order must match,
-- the order must be a UPI order still waiting for payment, and placed in the last three days.
create or replace function public.submit_payment_ref(p_number bigint, p_phone text, p_ref text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_status text;
begin
  if p_ref is null or p_ref !~ '^[A-Za-z0-9]{6,35}$' then
    raise exception 'BAD_REF';
  end if;
  update public.orders o
     set payment_ref = p_ref, updated_at = now()
   where o.number = p_number
     and o.payment_method = 'upi'
     and o.payment_status = 'pending'
     and right(regexp_replace(o.ship_phone, '\D', '', 'g'), 10) = right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10)
     and o.created_at > now() - interval '3 days'
  returning o.id, o.status into v_id, v_status;
  if v_id is null then
    return false;
  end if;
  insert into public.order_events (order_id, status, note) values (v_id, v_status, 'Customer sent UPI reference ' || p_ref);
  return true;
end;
$$;

revoke all on function public.submit_payment_ref(bigint, text, text) from public;
grant execute on function public.submit_payment_ref(bigint, text, text) to anon, authenticated;
