-- Editing an entry keeps the history: the old row is voided ("Edited") and a corrected row replaces it.
alter table public.ledger_entries add column replaces uuid references public.ledger_entries (id);

create or replace function public.edit_entry(
  p_id uuid, p_date date, p_kind text, p_partner uuid, p_amount numeric,
  p_category text, p_note text, p_bill text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare old public.ledger_entries; new_id uuid;
begin
  if not private.is_partner() then raise exception 'NOT_PARTNER'; end if;
  select * into old from public.ledger_entries where id = p_id and voided_at is null;
  if not found then raise exception 'NOT_FOUND'; end if;
  if private.month_locked(old.entry_date) or private.month_locked(p_date) then raise exception 'MONTH_LOCKED'; end if;
  update public.ledger_entries
     set voided_at = now(), voided_by = auth.uid(), void_reason = 'Edited'
   where id = p_id;
  insert into public.ledger_entries (entry_date, kind, partner_id, amount, category, note, bill_path, entered_by, replaces)
  values (p_date, p_kind, p_partner, p_amount, p_category, left(coalesce(p_note, ''), 500), coalesce(p_bill, old.bill_path), auth.uid(), p_id)
  returning id into new_id;
  return new_id;
end $$;
revoke all on function public.edit_entry(uuid, date, text, uuid, numeric, text, text, text) from public, anon;
grant execute on function public.edit_entry(uuid, date, text, uuid, numeric, text, text, text) to authenticated;
