-- Private admin notes and tags on a customer (for example "VIP").
--
-- These live in their own table, not on `customers`, because customers can read their own row in
-- `customers`. This table has a single policy that only admins pass, so a customer can never see it.

create table if not exists public.customer_notes (
  customer_id uuid primary key references public.customers (id) on delete cascade,
  notes text not null default '',
  tags text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.customer_notes enable row level security;

create policy "admins manage customer notes" on public.customer_notes
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
