-- Applied after 0002. Photo storage for products, and one function that saves a whole
-- product (details, colours and stock) in a single step so it either all saves or none of it does.

-- ------------------------------------------------------------ photo storage
-- A public bucket: anyone can view a photo by its address, but only admins can add or remove.
-- The bucket itself limits uploads to ordinary photo formats up to 5 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "admins upload product photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select private.is_admin()));

create policy "admins replace product photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()));

create policy "admins delete product photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()));

-- ------------------------------------------------------------ save a product
-- Runs as the person calling it, so the row level security rules still apply:
-- for anyone who is not an admin every write is refused.
-- The slug (the product's web address) is set when created and never changed afterwards.
create or replace function public.save_product(p jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  pid uuid := nullif(p->>'id', '')::uuid;
begin
  if pid is null then
    insert into public.products
      (slug, name, category, price, line, description, message_text, message_ref, details, sizes,
       tint, tag, christmas, contains, active, sort)
    values (
      p->>'slug',
      p->>'name',
      p->>'category',
      (p->>'price')::integer,
      coalesce(p->>'line', ''),
      coalesce(p->>'description', ''),
      nullif(p->>'message_text', ''),
      nullif(p->>'message_ref', ''),
      array(select jsonb_array_elements_text(coalesce(p->'details', '[]'::jsonb))),
      array(select jsonb_array_elements_text(coalesce(p->'sizes', '[]'::jsonb))),
      coalesce(nullif(p->>'tint', ''), '#1B4436'),
      nullif(p->>'tag', ''),
      coalesce((p->>'christmas')::boolean, false),
      array(select jsonb_array_elements_text(coalesce(p->'contains', '[]'::jsonb))),
      coalesce((p->>'active')::boolean, true),
      coalesce((p->>'sort')::integer, 0)
    )
    returning id into pid;
  else
    update public.products set
      name = p->>'name',
      category = p->>'category',
      price = (p->>'price')::integer,
      line = coalesce(p->>'line', ''),
      description = coalesce(p->>'description', ''),
      message_text = nullif(p->>'message_text', ''),
      message_ref = nullif(p->>'message_ref', ''),
      details = array(select jsonb_array_elements_text(coalesce(p->'details', '[]'::jsonb))),
      sizes = array(select jsonb_array_elements_text(coalesce(p->'sizes', '[]'::jsonb))),
      tint = coalesce(nullif(p->>'tint', ''), '#1B4436'),
      tag = nullif(p->>'tag', ''),
      christmas = coalesce((p->>'christmas')::boolean, false),
      contains = array(select jsonb_array_elements_text(coalesce(p->'contains', '[]'::jsonb))),
      active = coalesce((p->>'active')::boolean, true),
      sort = coalesce((p->>'sort')::integer, 0)
    where id = pid;
    if not found then
      raise exception 'product not found or not allowed';
    end if;
  end if;

  delete from public.product_colours where product_id = pid;
  insert into public.product_colours (product_id, name, hex, position)
  select pid, c->>'name', c->>'hex', (ord - 1)::integer
  from jsonb_array_elements(coalesce(p->'colours', '[]'::jsonb)) with ordinality as t(c, ord);

  delete from public.stock where product_id = pid;
  insert into public.stock (product_id, colour, size, qty)
  select pid, coalesce(s->>'colour', ''), coalesce(s->>'size', ''), (s->>'qty')::integer
  from jsonb_array_elements(coalesce(p->'stock', '[]'::jsonb)) as t(s);

  return pid;
end;
$$;

revoke execute on function public.save_product(jsonb) from public, anon;
grant execute on function public.save_product(jsonb) to authenticated;
