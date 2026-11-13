-- Parcel size per product (for shipping quotes) and Shiprocket details per order.
-- Weights are grams, sizes are centimetres. The numbers set below are starting guesses by
-- category; correct them per product in the admin.

alter table public.products
  add column if not exists weight_g integer not null default 300 check (weight_g between 1 and 50000),
  add column if not exists length_cm integer not null default 25 check (length_cm between 1 and 200),
  add column if not exists breadth_cm integer not null default 20 check (breadth_cm between 1 and 200),
  add column if not exists height_cm integer not null default 5 check (height_cm between 1 and 200);

update public.products set weight_g = 300,  length_cm = 28, breadth_cm = 22, height_cm = 3  where category = 'tshirt';
update public.products set weight_g = 700,  length_cm = 32, breadth_cm = 26, height_cm = 6  where category = 'hoodie';
update public.products set weight_g = 150,  length_cm = 25, breadth_cm = 20, height_cm = 10 where category = 'cap';
update public.products set weight_g = 250,  length_cm = 30, breadth_cm = 25, height_cm = 4  where category = 'tote';
update public.products set weight_g = 600,  length_cm = 28, breadth_cm = 10, height_cm = 10 where category = 'bottle';
update public.products set weight_g = 80,   length_cm = 12, breadth_cm = 8,  height_cm = 3  where category = 'keychain';
update public.products set weight_g = 1500, length_cm = 35, breadth_cm = 28, height_cm = 15 where category = 'hamper';

alter table public.orders
  add column if not exists payment_method text not null default 'prepaid' check (payment_method in ('prepaid', 'cod')),
  add column if not exists shiprocket_order_id text,
  add column if not exists shiprocket_shipment_id text,
  add column if not exists awb_code text,
  add column if not exists courier_name text,
  add column if not exists tracking_url text,
  add column if not exists shiprocket_status text,
  add column if not exists shiprocket_sent_at timestamptz;
