-- Partner accounting: two partner logins with usernames, a shared ledger, and a month-end check.
-- Only partners can read or write any of it. Entries are never deleted, only voided with a reason.

create table public.partners (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9]{3,20}@kalo$'),
  display_name text not null,
  username_changed boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function private.is_partner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.partners where user_id = (select auth.uid()));
$$;
grant execute on function private.is_partner() to anon, authenticated;

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default (now() at time zone 'Asia/Kolkata')::date,
  kind text not null check (kind in ('put_in', 'paid_bank', 'paid_personally', 'taken_out', 'money_in')),
  -- whose money it is: required for put_in, paid_personally and taken_out
  partner_id uuid references public.partners (user_id),
  amount numeric(12, 2) not null check (amount > 0),
  category text not null default 'Other',
  note text not null default '' check (char_length(note) <= 500),
  bill_path text,
  entered_by uuid not null references public.partners (user_id) default auth.uid(),
  created_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by uuid references public.partners (user_id),
  void_reason text,
  check ((kind in ('put_in', 'paid_personally', 'taken_out')) = (partner_id is not null))
);
create index on public.ledger_entries (entry_date desc, created_at desc);

create table public.month_checks (
  month date primary key check (month = date_trunc('month', month)::date),
  real_balance numeric(12, 2) not null,
  app_balance numeric(12, 2) not null,
  started_by uuid not null references public.partners (user_id),
  created_at timestamptz not null default now()
);

create table public.month_confirms (
  month date not null references public.month_checks (month) on delete cascade,
  partner_id uuid not null references public.partners (user_id),
  confirmed_at timestamptz not null default now(),
  primary key (month, partner_id)
);

alter table public.partners enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.month_checks enable row level security;
alter table public.month_confirms enable row level security;

create policy "partners read partners" on public.partners for select using ((select private.is_partner()));
create policy "partners read ledger" on public.ledger_entries for select using ((select private.is_partner()));
create policy "partners add ledger" on public.ledger_entries for insert
  with check ((select private.is_partner()) and entered_by = (select auth.uid()) and voided_at is null);
create policy "partners read checks" on public.month_checks for select using ((select private.is_partner()));
create policy "partners read confirms" on public.month_confirms for select using ((select private.is_partner()));
-- no update or delete policies: changes go through the functions below

-- A month is locked once both partners have confirmed it.
create or replace function private.month_locked(d date) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.month_checks c
    where c.month = date_trunc('month', d)::date
      and (select count(*) from public.month_confirms f where f.month = c.month) >= 2
  );
$$;

create or replace function private.block_locked_entries() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if private.month_locked(coalesce(new.entry_date, old.entry_date)) then
    raise exception 'MONTH_LOCKED';
  end if;
  return new;
end $$;
create trigger ledger_month_lock before insert or update on public.ledger_entries
  for each row execute function private.block_locked_entries();

-- Entries are append-only: only the void columns may change, and only once.
create or replace function private.ledger_append_only() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (to_jsonb(new) - 'voided_at' - 'voided_by' - 'void_reason') is distinct from
     (to_jsonb(old) - 'voided_at' - 'voided_by' - 'void_reason') or old.voided_at is not null then
    raise exception 'LEDGER_APPEND_ONLY';
  end if;
  return new;
end $$;
create trigger ledger_append_only before update on public.ledger_entries
  for each row execute function private.ledger_append_only();

-- Bank balance up to and including a date (voided entries ignored).
create or replace function private.bank_balance(upto date) returns numeric
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(case when kind in ('put_in', 'money_in') then amount else -amount end), 0)
  from public.ledger_entries
  where voided_at is null and kind <> 'paid_personally' and entry_date <= upto;
$$;

create or replace function public.void_entry(p_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_partner() then raise exception 'NOT_PARTNER'; end if;
  if length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'REASON_REQUIRED'; end if;
  update public.ledger_entries
     set voided_at = now(), voided_by = auth.uid(), void_reason = left(trim(p_reason), 300)
   where id = p_id and voided_at is null;
  if not found then raise exception 'NOT_FOUND'; end if;
end $$;

-- Starts (or restarts) the check for a month: records the real bank balance next to the app's balance.
create or replace function public.start_month_check(p_month date, p_real numeric) returns void
language plpgsql security definer set search_path = '' as $$
declare m date := date_trunc('month', p_month)::date;
begin
  if not private.is_partner() then raise exception 'NOT_PARTNER'; end if;
  if m >= date_trunc('month', (now() at time zone 'Asia/Kolkata')::date)::date then raise exception 'MONTH_NOT_OVER'; end if;
  if private.month_locked(m) then raise exception 'MONTH_LOCKED'; end if;
  delete from public.month_confirms where month = m;
  insert into public.month_checks (month, real_balance, app_balance, started_by)
  values (m, p_real, private.bank_balance((m + interval '1 month - 1 day')::date), auth.uid())
  on conflict (month) do update
    set real_balance = excluded.real_balance, app_balance = excluded.app_balance,
        started_by = excluded.started_by, created_at = now();
end $$;

create or replace function public.confirm_month(p_month date) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_partner() then raise exception 'NOT_PARTNER'; end if;
  if not exists (select 1 from public.month_checks where month = p_month) then raise exception 'NO_CHECK'; end if;
  insert into public.month_confirms (month, partner_id) values (p_month, auth.uid()) on conflict do nothing;
end $$;

-- Username changes: once only.
create or replace function public.change_username(p_username text) returns void
language plpgsql security definer set search_path = '' as $$
declare u text := lower(trim(p_username));
begin
  if not private.is_partner() then raise exception 'NOT_PARTNER'; end if;
  if u !~ '^[a-z0-9]{3,20}@kalo$' then raise exception 'BAD_USERNAME'; end if;
  if exists (select 1 from public.partners where user_id = auth.uid() and username_changed) then raise exception 'ALREADY_CHANGED'; end if;
  if exists (select 1 from public.partners where username = u and user_id <> auth.uid()) then raise exception 'TAKEN'; end if;
  update public.partners set username = u, username_changed = true where user_id = auth.uid();
end $$;

-- The sign-in page turns a username into the account's email so the password can be checked.
create or replace function public.partner_login_email(p_username text) returns text
language sql stable security definer set search_path = '' as $$
  select u.email::text from public.partners p join auth.users u on u.id = p.user_id
  where p.username = lower(trim(p_username));
$$;

revoke all on function public.void_entry(uuid, text), public.start_month_check(date, numeric),
  public.confirm_month(date), public.change_username(text) from public, anon;
grant execute on function public.void_entry(uuid, text), public.start_month_check(date, numeric),
  public.confirm_month(date), public.change_username(text) to authenticated;
revoke all on function public.partner_login_email(text) from public;
grant execute on function public.partner_login_email(text) to anon, authenticated;

-- Private bucket for bill photos, one folder per partner.
insert into storage.buckets (id, name, public) values ('bills', 'bills', false) on conflict do nothing;
create policy "partners read bills" on storage.objects for select
  using (bucket_id = 'bills' and (select private.is_partner()));
create policy "partners add bills" on storage.objects for insert
  with check (bucket_id = 'bills' and (select private.is_partner()) and (storage.foldername(name))[1] = (select auth.uid())::text);
