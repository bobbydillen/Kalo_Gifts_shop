-- The "Build your own hamper" product is only ever ordered through the builder, with its parts.
-- Without this, an order line for it with no parts would be accepted as a plain ₹99 item,
-- an empty hamper. place_order now treats it as unavailable unless it carries parts.

do $patch$
declare
  d text := pg_get_functiondef('public.place_order(jsonb)'::regprocedure);
  n text;
begin
  n := replace(d, E'where pr.slug = v_slug and pr.active;', E'where pr.slug = v_slug and pr.active and not pr.build_your_own;');
  if n = d then raise exception 'patch failed'; end if;
  execute n;
end
$patch$;

revoke execute on function public.place_order(jsonb) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;
