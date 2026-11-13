-- Custom photo frames: the customer uploads a photo that we print and frame.
--
--   * products.custom_photo   the item needs a customer photo (a photo frame, or a hamper that holds one)
--   * products.photo_size     the frame size when the item has no size choice (for example a hamper): A5, A4 or A3
--   * products.size_prices    price per size, for example {"A5":499,"A4":799,"A3":1299}; a size not listed uses `price`
--   * order_items.photo_path  where the customer's cropped photo is stored
--
-- Photos go in a PRIVATE bucket. Anyone can upload one (a visitor has no account yet) but only a
-- file with a random name, only an image, and only up to 8 MB. Only admins can look at them.
-- place_order checks that the photo exists before it accepts an order that needs one.

alter table public.products drop constraint if exists products_category_check;
alter table public.products add constraint products_category_check
  check (category in ('tshirt','hoodie','cap','keychain','tote','bottle','hamper','frame'));

alter table public.products
  add column if not exists custom_photo boolean not null default false,
  add column if not exists photo_size text not null default 'A4' check (photo_size in ('A5', 'A4', 'A3')),
  add column if not exists size_prices jsonb not null default '{}'::jsonb;

alter table public.order_items add column if not exists photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('customer-photos', 'customer-photos', false, 8388608, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

create policy "anyone can upload a customer photo" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'customer-photos' and name ~ '^uploads/[0-9a-f-]{36}\.(webp|jpg)$');

create policy "admins read customer photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'customer-photos' and (select private.is_admin()));

create policy "admins delete customer photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'customer-photos' and (select private.is_admin()));

-- place_order: price by size, and require a stored photo for items that need one.
do $patch$
declare
  d text := pg_get_functiondef('public.place_order(jsonb)'::regprocedure);
  n text;
begin
  n := replace(d, E'  v_card text;\n', E'  v_card text;\n  v_photo text;\n');
  if n = d then raise exception 'patch 1 failed'; end if;
  d := n;

  n := replace(d, E'      raise exception ''CARD_TOO_LONG'';\n    end if;\n',
    E'      raise exception ''CARD_TOO_LONG'';\n    end if;\n\n' ||
    E'    v_photo := nullif(btrim(coalesce(v_item->>''photo'', '''')), '''');\n' ||
    E'    if v_prod.custom_photo then\n' ||
    E'      if v_photo is null\n' ||
    E'         or v_photo !~ ''^uploads/[0-9a-f-]{36}\\.(webp|jpg)$''\n' ||
    E'         or not exists (select 1 from storage.objects o where o.bucket_id = ''customer-photos'' and o.name = v_photo) then\n' ||
    E'        raise exception ''PHOTO_REQUIRED:%'', v_prod.name;\n' ||
    E'      end if;\n' ||
    E'    else\n' ||
    E'      v_photo := null;\n' ||
    E'    end if;\n');
  if n = d then raise exception 'patch 2 failed'; end if;
  d := n;

  n := replace(d, E'    v_unit := v_prod.price\n', E'    v_unit := coalesce((v_prod.size_prices ->> v_size)::integer, v_prod.price)\n');
  if n = d then raise exception 'patch 3 failed'; end if;
  d := n;

  n := replace(d, E'''card'', v_card));', E'''card'', v_card, ''photo'', v_photo));');
  if n = d then raise exception 'patch 4 failed'; end if;
  d := n;

  n := replace(d, E'gift_wrap, card_message)\n  select', E'gift_wrap, card_message, photo_path)\n  select');
  if n = d then raise exception 'patch 5 failed'; end if;
  d := n;

  n := replace(d, E'(l->>''wrap'')::boolean, l->>''card''\n', E'(l->>''wrap'')::boolean, l->>''card'', l->>''photo''\n');
  if n = d then raise exception 'patch 6 failed'; end if;

  execute n;
end
$patch$;

revoke execute on function public.place_order(jsonb) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;
