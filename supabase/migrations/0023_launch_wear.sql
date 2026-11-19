-- Launch wear: the five real pieces replace the sample tees and hoodie.
-- Sample orders keep their own product name and price, so deleting the samples does not change them.
-- Prices, sizes and details are first values to confirm in the admin.

begin;

-- the two hampers that held a sample piece now hold the nearest real one
update public.products
set contains = array_replace(contains, 'be-still-hoodie', 'all-the-time-hoodie'), updated_at = now()
where slug = 'joy-hamper';

update public.products
set contains = array_replace(contains, 'grace-tee', 'gracias-cristo-tee'), updated_at = now()
where slug = 'everyday-hamper';

-- remove the sample wear (their colours, stock and photo rows go with them)
delete from public.products
where slug in ('joy-tee', 'grace-tee', 'be-still-tee', 'anchor-tee', 'be-still-hoodie');

insert into public.products
  (slug, name, category, price, line, description, message_text, message_ref, details, sizes, tint, tag, christmas, active, sort,
   weight_g, length_cm, breadth_cm, height_cm, design_group, design_label, size_prices, contains, custom_photo, build_your_own, photo_size)
values
  ('for-his-glory-tee', 'For His Glory Tee', 'tshirt', 899,
   'Whatever you do, do it all for the glory of God.',
   'A washed-black oversized tee. A small crowned cross sits on the chest, and FOR HIS GLORY runs large across the back in weathered, wood-grain letters. Made for every day, not only Sundays.',
   'Whatever you do, do it all for the glory of God.', '1 Corinthians 10:31',
   array['Oversized fit, dropped shoulder', 'Heavyweight cotton, washed black', 'Printed front and back', 'Machine wash cold, inside out'],
   array['S','M','L','XL','XXL'], '#3a3530', null, false, true, 1, 310, 30, 24, 3, '', '', '{}'::jsonb, '{}', false, false, 'A4'),

  ('paid-in-full-tee', 'Paid in Full Tee', 'tshirt', 899,
   'A receipt from Calvary. Every debt, settled.',
   'A bone-coloured oversized tee. The front carries a small red PAID IN FULL stamp; the back is a receipt from Calvary, listing every shame and regret, with the amount due: nothing. Paid and owned by Jesus Christ of Nazareth.',
   'It is finished.', 'John 19:30',
   array['Oversized fit, dropped shoulder', 'Heavyweight cotton, bone', 'Printed front and back', 'Machine wash cold, inside out'],
   array['S','M','L','XL','XXL'], '#b9ad95', null, false, true, 2, 310, 30, 24, 3, '', '', '{}'::jsonb, '{}', false, false, 'A4'),

  ('gracias-cristo-tee', 'Gracias Cristo Tee', 'tshirt', 899,
   'Dios lo hizo. God did it, from the manger on.',
   'An olive oversized tee. DIOS LO HIZO, God did it, sits quietly across the chest, and the back shows the nativity against a red rising sun under the words GRACIAS CRISTO.',
   'Unto you is born this day a Saviour, which is Christ the Lord.', 'Luke 2:11',
   array['Oversized fit, dropped shoulder', 'Heavyweight cotton, olive', 'Printed front and back', 'Machine wash cold, inside out'],
   array['S','M','L','XL','XXL'], '#5b6142', 'Christmas edit', true, true, 3, 310, 30, 24, 3, '', '', '{}'::jsonb, '{}', false, false, 'A4'),

  ('all-the-time-hoodie', 'All the Time Hoodie', 'hoodie', 1499,
   'God is good, all the time.',
   'A heavy black hoodie. Across the back: GOD IS GOOD, ALL THE TIME over mountains, pines and a river running toward a rising orange sun.',
   'For the Lord is good; his mercy is everlasting.', 'Psalm 100:5',
   array['Oversized fit, relaxed hood', 'Cotton fleece, brushed inside', 'Printed on the back', 'Machine wash cold, inside out'],
   array['S','M','L','XL','XXL'], '#2a2622', null, false, true, 4, 750, 34, 28, 6, '', '', '{}'::jsonb, '{}', false, false, 'A4'),

  ('merry-christmas-tee', 'Merry Christmas Tee', 'tshirt', 899,
   'A cross, a star and a ribbon of gold.',
   'A Christmas-red oversized tee with a plain front. On the back, a white cross with a gold star at its heart, wrapped in a ribbon of gold that becomes a Christmas tree, above MERRY Christmas in gold script.',
   'For unto us a child is born, unto us a son is given.', 'Isaiah 9:6',
   array['Oversized fit, dropped shoulder', 'Heavyweight cotton, Christmas red', 'Plain front, printed back', 'Machine wash cold, inside out'],
   array['S','M','L','XL','XXL'], '#a3232b', 'Christmas edit', true, true, 5, 310, 30, 24, 3, '', '', '{}'::jsonb, '{}', false, false, 'A4');

-- photos: the cut-out garment first (back, then front), then the worn photos
insert into public.product_images (product_id, path, position, colour)
select p.id, '/catalog/' || p.slug || '/' || f.file, f.pos, ''
from public.products p
join (values
  ('for-his-glory-tee', 'cut-back.webp', 0), ('for-his-glory-tee', 'cut-front.webp', 1), ('for-his-glory-tee', 'worn-back.webp', 2), ('for-his-glory-tee', 'worn-front.webp', 3),
  ('paid-in-full-tee', 'cut-back.webp', 0), ('paid-in-full-tee', 'cut-front.webp', 1), ('paid-in-full-tee', 'worn-back.webp', 2), ('paid-in-full-tee', 'worn-front.webp', 3),
  ('gracias-cristo-tee', 'cut-back.webp', 0), ('gracias-cristo-tee', 'cut-front.webp', 1), ('gracias-cristo-tee', 'worn-back.webp', 2), ('gracias-cristo-tee', 'worn-front.webp', 3),
  ('all-the-time-hoodie', 'cut-back.webp', 0), ('all-the-time-hoodie', 'worn-back.webp', 1),
  ('merry-christmas-tee', 'cut-back.webp', 0), ('merry-christmas-tee', 'cut-front.webp', 1), ('merry-christmas-tee', 'worn-back.webp', 2)
) as f(slug, file, pos) on f.slug = p.slug;

commit;

-- first stock counts for the launch pieces (to be corrected in the admin)
insert into public.stock (product_id, colour, size, qty)
select p.id, '', s.size, (array[12,18,24,20,10])[s.n]
from public.products p
cross join (values ('S',1),('M',2),('L',3),('XL',4),('XXL',5)) as s(size, n)
where p.slug in ('for-his-glory-tee','paid-in-full-tee','gracias-cristo-tee','all-the-time-hoodie','merry-christmas-tee')
on conflict do nothing;
