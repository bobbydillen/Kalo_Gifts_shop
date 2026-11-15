-- Search-engine titles and descriptions the admin can change. A page with no row uses the defaults in code.
create table public.seo_pages (
  key text primary key check (key ~ '^[a-z0-9:_-]{1,120}$'),
  title text not null default '' check (char_length(title) <= 120),
  description text not null default '' check (char_length(description) <= 320),
  updated_at timestamptz not null default now()
);
alter table public.seo_pages enable row level security;
create policy "anyone reads seo" on public.seo_pages for select using (true);
create policy "admins add seo" on public.seo_pages for insert with check ((select private.is_admin()));
create policy "admins change seo" on public.seo_pages for update using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins remove seo" on public.seo_pages for delete using ((select private.is_admin()));
