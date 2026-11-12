-- Every new order must carry a valid email (the customer signs in with it to see their orders).
-- Enforced in the database so a request made straight to the API cannot skip it.
-- Older orders without an email are left alone (not valid is only checked for new rows).
create or replace function private.require_order_email()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.customer_email is null or btrim(new.customer_email) = '' then
    raise exception 'BAD_EMAIL';
  end if;
  return new;
end;
$$;

create trigger orders_require_email
  before insert on public.orders
  for each row execute function private.require_order_email();
