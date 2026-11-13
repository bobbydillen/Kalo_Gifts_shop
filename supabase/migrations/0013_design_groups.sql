-- Products that share a design_group are different prints of the same item (for example two bottles with different artwork).
-- design_label is the short name shown on the picker, for example "Cross" or "Be still". Empty falls back to the product name.
alter table public.products
  add column if not exists design_group text not null default '',
  add column if not exists design_label text not null default '';
create index if not exists products_design_group_idx on public.products (design_group) where design_group <> '';
