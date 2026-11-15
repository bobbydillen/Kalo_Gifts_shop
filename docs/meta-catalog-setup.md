# Meta (Facebook and Instagram) catalog ads: setup

The website side is built:

- **Product feed:** `https://kalogifts.com/feed/meta.csv` lists every product (id, title, description, price in INR, stock, link, photos). Meta reads it on a schedule.
- **Photos in the feed** go through `/feed/image`, which hands Meta a square JPEG.
- **Meta Pixel:** added to the shop when a Pixel ID is saved in Admin, Settings, "Facebook and Instagram ads". It reports PageView, ViewContent (product page), AddToCart, InitiateCheckout and Purchase. The product id it sends is the product's web name (for example `joy-tee`), the same as the feed id.

## Steps in Meta (done by the business owner)

1. Create or open a **Meta Business portfolio** at business.facebook.com. Add the Facebook Page and the Instagram business account.
2. **Verify the domain** (Business settings, Brand safety, Domains, Add `kalogifts.com`). Choose the DNS TXT option and add the record in Netlify DNS.
3. In **Events Manager**, create a **Pixel** (a data source). Copy its ID into Admin, Settings.
4. In **Commerce Manager**, create a **catalog** (type: E-commerce). Add a data source: **Scheduled feed**, URL `https://kalogifts.com/feed/meta.csv`, currency INR, every hour or day.
5. Open Diagnostics in the catalog and fix any warnings. Check that the Pixel and the catalog are connected (Settings, Events data sources).
6. In **Ads Manager**, create a **Sales** campaign with a **catalog** (Advantage+ catalog ads), choose carousel format and a "Shop now" button.

## Later

- Conversions API (sends orders from the server so ad blockers cannot hide them) needs a secret access token kept in the hosting settings. Not built yet.
- Instagram product tags and the Shop tab depend on whether Meta offers Shopping in India for the account. Check in Commerce Manager.
