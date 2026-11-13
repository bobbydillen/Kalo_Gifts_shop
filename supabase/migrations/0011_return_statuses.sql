-- Two more order statuses for returns, set by hand in the admin after the customer chats with us:
--   return_arranged  a pickup or return has been agreed and arranged
--   returned         the parcel is back with us (the refund or exchange is handled by hand)
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('new','confirmed','packing','shipped','delivered','cancelled','return_arranged','returned'));
