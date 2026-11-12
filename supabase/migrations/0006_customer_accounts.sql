-- Applied after 0005. Customer accounts by phone number.
--
-- A customer signs in with their mobile number and a one-time code sent by SMS (Supabase Auth
-- phone login). Once the code is verified, their sign-in token carries their phone number.
-- These rules let that person read their own customer record, saved addresses, orders and
-- order history, and nothing else. Admins keep full access through the existing admin rules.
--
-- Supabase stores phone numbers without the leading "+", so my_phone() adds it back to match
-- the +91XXXXXXXXXX form used in the customers table. It returns null for anyone who is not
-- signed in by phone (visitors, and admins who sign in by email), which matches no rows.

insert into public.site_settings (key, value) values ('customer_login', 'false')
on conflict (key) do nothing;

create or replace function private.my_phone()
returns text
language sql
stable
set search_path = ''
as $$
  select case
           when (select auth.jwt() ->> 'phone') ~ '^[0-9]{10,15}$'
           then '+' || (select auth.jwt() ->> 'phone')
         end;
$$;

grant execute on function private.my_phone() to anon, authenticated;

create policy "customers read their own record" on public.customers
  for select to authenticated
  using (phone = (select private.my_phone()));

create policy "customers read their own addresses" on public.addresses
  for select to authenticated
  using (customer_id in (select c.id from public.customers c where c.phone = (select private.my_phone())));

create policy "customers read their own orders" on public.orders
  for select to authenticated
  using (customer_id in (select c.id from public.customers c where c.phone = (select private.my_phone())));

create policy "customers read their own order items" on public.order_items
  for select to authenticated
  using (order_id in (
    select o.id from public.orders o
     where o.customer_id in (select c.id from public.customers c where c.phone = (select private.my_phone()))));

create policy "customers read their own order history" on public.order_events
  for select to authenticated
  using (order_id in (
    select o.id from public.orders o
     where o.customer_id in (select c.id from public.customers c where c.phone = (select private.my_phone()))));
