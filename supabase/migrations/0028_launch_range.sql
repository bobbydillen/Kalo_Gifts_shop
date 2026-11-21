-- Launch range (applied 2026-11-21): T-shirts, hoodies, bottles, photo frames and hampers only.
-- Caps, tote bags and keychains are hidden (the shop shows them as "coming soon"), and the two
-- ready-made hampers now hold only pieces that are on sale.

update public.products set active = false where slug in ('carry-tote', 'hold-fast-cap', 'anchor-keychain');

update public.products set
  contains = array['gracias-cristo-tee', 'be-the-light-slim-sip', 'trust-in-the-lord-frame'],
  line = 'A tee, a bottle and a verse frame for the daily round.',
  description = 'Three pieces for every day: our Gracias Cristo Tee, a Be the Light Slim Sip bottle and a Trust in the Lord verse frame, packed together in a gift box with tissue and a ribbon. A thoughtful gift for friends and family.',
  details = array['Gracias Cristo Tee, Be the Light Slim Sip bottle and Trust in the Lord frame', 'Packed in a gift box with tissue and ribbon', 'Choose the tee size', 'Add a handwritten card']
where slug = 'everyday-hamper';

update public.products set
  contains = array['all-the-time-hoodie', 'psalm-91-flowstate', 'light-of-the-world-frame'],
  line = 'A hoodie, a bottle and a verse frame, wrapped and ready.',
  description = 'A gift for someone who deserves a proper surprise: our All the Time Hoodie, a Psalm 91 FlowState Tumbler and a You Are the Light of the World verse frame, packed in a gift box with tissue and a ribbon. Add a handwritten card to make it theirs.',
  details = array['All the Time Hoodie, Psalm 91 FlowState Tumbler and Light of the World frame', 'Packed in a gift box with tissue and ribbon', 'Choose the hoodie size', 'Add a handwritten card']
where slug = 'joy-hamper';

-- the "open box" photos showed the old tote, cap and keychain
delete from public.product_images where path in ('/catalog/everyday-hamper/2-open.webp', '/catalog/joy-hamper/2-open.webp');

-- online payments switch (only shows where the server has the Cashfree keys)
insert into public.site_settings (key, value) values ('online_payments', 'true'::jsonb)
on conflict (key) do update set value = excluded.value;
