-- Which colour a product photo shows. Empty means it belongs to every colour (for example a lifestyle shot).
alter table public.product_images add column if not exists colour text not null default '';
