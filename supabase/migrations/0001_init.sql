-- KALO Gifts: first database design (DRAFT, not applied yet).
--
-- Access model:
--   * Visitors can read active products, their photos, colours and the public site settings.
--   * Customers, addresses, orders and one-time codes are never readable from the browser.
--     The site's server writes and reads them with the service key (customers sign in by
--     phone number and WhatsApp code, not through Supabase Auth).
--   * Admins (rows in public.admins, linked to Supabase Auth users) can read and change everything.

-- ---------------------------------------------------------------- admins
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- ---------------------------------------------------------------- settings
-- One row per setting. Seasonal switches, dates, gift prices, ticker text.
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value) values
  ('snowfall', 'true'),
  ('countdown', 'true'),
  ('christmas_hero', 'true'),
  ('order_by_banner', 'true'),
  ('order_by_date', '"2026-12-18T23:59:00+05:30"'),
  ('christmas_date', '"2026-12-25T00:00:00+05:30"'),
  ('gift_wrap_price', '50'),
  ('gift_card_price', '50'),
  ('gift_card_max_chars', '250');

-- ---------------------------------------------------------------- catalogue
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null check (category in ('tshirt','hoodie','cap','keychain','tote','bottle','hamper')),
  price integer not null check (price >= 0),            -- rupees
  line text not null default '',                        -- one-line hook
  description text not null default '',
  message_text text,                                    -- verse or words on the piece
  message_ref text,
  details text[] not null default '{}',
  sizes text[] not null default '{}',                   -- empty when the product has no sizes
  tint text not null default '#1B4436',
  tag text,
  christmas boolean not null default false,
  contains text[] not null default '{}',                -- hampers: slugs of the products inside
  active boolean not null default true,                 -- hidden from the shop when false
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category) where active;

create table public.product_colours (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  hex text not null,
  position integer not null default 0,
  unique (product_id, name)
);

-- Units in stock per variant. colour or size is '' when the product has none.
create table public.stock (
  product_id uuid not null references public.products (id) on delete cascade,
  colour text not null default '',
  size text not null default '',
  qty integer not null default 0 check (qty >= 0),
  primary key (product_id, colour, size)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  path text not null,                                    -- file in Supabase Storage
  colour text not null default '',                       -- '' = shown for every colour
  position integer not null default 0
);
create index product_images_product_idx on public.product_images (product_id, position);

-- ---------------------------------------------------------------- customers
-- A customer exists as soon as someone checks out with a phone number.
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,                            -- +91XXXXXXXXXX
  name text not null default '',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text not null default '',
  city text not null,
  state text not null,
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_customer_idx on public.addresses (customer_id);

-- One-time codes sent on WhatsApp. Only a hash of the code is kept.
create table public.login_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  used boolean not null default false,
  created_at timestamptz not null default now()
);
create index login_codes_phone_idx on public.login_codes (phone, created_at desc);

-- ---------------------------------------------------------------- orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity (start with 1001) unique,  -- the number people quote
  customer_id uuid not null references public.customers (id),
  status text not null default 'new'
    check (status in ('new','confirmed','packing','shipped','delivered','cancelled')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','refunded')),
  subtotal integer not null check (subtotal >= 0),
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  total integer not null check (total >= 0),
  -- the address as it was when the order was placed
  ship_name text not null,
  ship_phone text not null,
  ship_line1 text not null,
  ship_line2 text not null default '',
  ship_city text not null,
  ship_state text not null,
  ship_pincode text not null,
  customer_note text not null default '',
  tracking_note text not null default '',                -- courier and tracking number, set by admin
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_customer_idx on public.orders (customer_id, created_at desc);

-- What was bought. Names and prices are copied so later catalogue edits do not rewrite history.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_slug text not null,
  product_name text not null,
  colour text not null default '',
  size text not null default '',
  qty integer not null check (qty > 0),
  unit_price integer not null check (unit_price >= 0),   -- includes gift options
  gift_wrap boolean not null default false,
  card_message text not null default ''                  -- handwritten card; empty means no card
);
create index order_items_order_idx on public.order_items (order_id);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at);

-- ---------------------------------------------------------------- keep updated_at current
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- row level security
alter table public.admins enable row level security;
alter table public.site_settings enable row level security;
alter table public.products enable row level security;
alter table public.product_colours enable row level security;
alter table public.stock enable row level security;
alter table public.product_images enable row level security;
alter table public.customers enable row level security;
alter table public.addresses enable row level security;
alter table public.login_codes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;

-- Visitors: read the shop.
create policy "anyone reads settings" on public.site_settings for select using (true);
create policy "anyone reads active products" on public.products for select using (active);
create policy "anyone reads colours of active products" on public.product_colours for select
  using (exists (select 1 from public.products p where p.id = product_id and p.active));
create policy "anyone reads stock of active products" on public.stock for select
  using (exists (select 1 from public.products p where p.id = product_id and p.active));
create policy "anyone reads images of active products" on public.product_images for select
  using (exists (select 1 from public.products p where p.id = product_id and p.active));

-- Admins: everything.
create policy "admins read admins" on public.admins for select using ((select public.is_admin()));
create policy "admins manage settings" on public.site_settings for all
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins manage products" on public.products for all
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins manage colours" on public.product_colours for all
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins manage stock" on public.stock for all
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins manage images" on public.product_images for all
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins manage customers" on public.customers for all
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins manage addresses" on public.addresses for all
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins manage orders" on public.orders for all
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins manage order items" on public.order_items for all
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins manage order events" on public.order_events for all
  using ((select public.is_admin())) with check ((select public.is_admin()));
-- login_codes has no policy on purpose: only the server (service key) can touch it.
