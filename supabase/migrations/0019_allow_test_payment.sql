-- The "test" payment method added in 0018 was refused by the old check on orders.payment_method.
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check check (payment_method in ('prepaid', 'cod', 'test'));
