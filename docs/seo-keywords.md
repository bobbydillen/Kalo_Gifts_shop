# KALO Gifts: search keyword plan

Written 2026-11-15. This is a plan built from how people phrase searches for these products, plus what other Indian sellers show. **It is not search-volume data.** Free search tools (Google Keyword Planner, Google Search Console after launch) give the real numbers; check them after a few weeks and adjust.

## What the research showed

- Indian Christian gift stores sell mostly Bible verse wall frames, brass religious decor, cards, mugs, keychains and personalised frames.
- Bible verse T-shirts in India exist but are few, and many top results are US stores (Walmart, Etsy) that do not serve Indian buyers well.
- Christmas hampers in India are mostly sweets, cakes and dry fruit hampers from general gifting sites. None of the ones found are Christian themed.
- Bible verse water bottles: results were almost all US/UK/Australia sellers. No Indian seller of verse-printed bottles turned up. This is the biggest gap.
- Personalisation (names, verses, photos) is a repeated selling point.

## Keyword groups and the page that targets each

| Page | Main phrases people would type | Where it is used |
|---|---|---|
| Home `/` | Christian T-shirts, printed Christian gifts, Christian gifts India, Christian gift shop online, faith gifts | Title, description, organisation data |
| `/gifts` | Christian gifts online India, Bible verse gifts, Christian gift ideas | Title, description |
| `/gifts/t-shirts` | Christian T-shirts India, printed Christian T-shirts, Bible verse t-shirt, Jesus t-shirt, faith tee, printed Christian tee | Title, description, page paragraph |
| `/gifts/hoodies` | Christian hoodie India, Bible verse hoodie, Jesus hoodie | same |
| `/gifts/bottles` | Bible verse water bottle, Christian water bottle India, printed bottle Christian gift | same |
| `/gifts/hampers` | Christian gift hamper, Christmas gift hamper India | same |
| `/hampers/build` | customised Christmas hamper, build your own gift hamper, personalised hamper India | Title, description |
| `/christmas` | Christian Christmas gifts, Christmas gifts for Christians, Christmas gift ideas India | Title, description |
| `/gifts/photo-frames` | personalised photo frame, custom photo frame gift India | same |
| `/gifts/keychains`, `/caps`, `/tote-bags` | Christian keychain, Bible verse tote bag, Christian cap | same |

Other phrases worth watching in Search Console: "Bible verse gifts for friends", "Christian birthday gift", "baptism gift India", "Sunday school gift", "youth group gift", "Christian gift for pastor", "Secret Santa Christian gift", "Jesus gifts online".

## Done in the code

- Page titles and descriptions use the phrases above (categories in `src/lib/catalog.ts`).
- Each category page has a short paragraph under the products so there is real text to read.
- Product pages carry price and stock data for Google, and share previews.
- `sitemap.xml` and `robots.txt` exist; private pages are excluded.

## Still to do (not code)

1. Add `kalogifts.com` to Google Search Console and submit the sitemap.
2. Write the actual verses and a short story on each product page (in the admin). Real text beats thin pages.
3. Add real photos with alt text that describes the product.
4. Make a Google Business Profile and an Instagram account that links to the shop.
5. Later: a few blog pages ("Christmas gift ideas for a Christian friend", "Bible verses for Christmas cards") because those are the questions people search before buying.
