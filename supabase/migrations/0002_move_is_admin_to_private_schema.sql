-- Applied to the live project after 0001.
--
-- is_admin() is used inside row level security rules. Left in the public schema it
-- could also be called directly through the public web address. It is harmless (it only
-- tells the caller whether they themselves are an admin), but nothing needs that, so it
-- moves to a schema the web address does not expose. The rules that use it keep working:
-- they refer to the function itself, not its schema name.
create schema if not exists private;
alter function public.is_admin() set schema private;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;
