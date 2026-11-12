# KALO Gifts website: build plan

Status: confirmed 2026-11-11. Phases 1 to 3 built. Phase 4: bag, gift options and checkout built (orders stay switched off in Settings until a way to pay is ready); customer accounts by emailed code built, waiting on Supabase email sending setup (phone code sign-in built but hidden); payments still to come. Phase 5: database and admin (overview, orders, products, settings) built; the shop reads products and settings from the database.

## 1. What we are building

A fully custom online store for KALO Gifts, with its own admin panel, launching with a Christmas theme that can be switched off afterwards without code changes.

- **Look:** the dark night-green, cream and gold theme from the approved mock page (Bodoni Moda headings with one italic word, Manrope body, pill buttons, rounded cards, frosted header, grain, ticker).
- **Tone:** warm, modern, welcoming to everyone. Faith is shown gently (for example, the "tap the gift" verse card), never preached on main pages.
- **Structure:** shop by person and occasion, as on Uncommon Goods.
- **Motion:** smooth by default, with a small bounce on buttons, chips, the bag counter and the gift, as on Jinglefest but quieter.

## 2. Technology

| Part | Choice | Why |
|---|---|---|
| Site and admin | Next.js + TypeScript + Tailwind CSS | Fast pages, good SEO, one codebase for shop and admin |
| Database, logins, image storage | Supabase | Already connected to this workspace; no server to maintain |
| Hosting | Vercel | Already connected; automatic deploys |
| Payments | Razorpay (UPI, cards, netbanking, COD flag) | Standard for Indian stores |
| Animation | Motion for interface, GSAP for the logo and hero | Detailed timeline control for the logo |
| Order emails | Resend | Simple transactional email |

Accounts and keys for Razorpay, Resend and the domain have to be created and entered by you; I will tell you exactly where each one goes.

## 3. Pages

**Shop**
1. Home: the logo hero is always first; while Christmas is switched on, the Christmas block is the second section
   - `/christmas`: its own page opening with the Christmas hero, for Christmas searches, ads and social links. Out of season it shows a short "back next season" message.
2. Collection pages: all gifts, by product type, Christmas gifts, hampers
3. "Gifts for every loved one": family, friends, church, Secret Santa
4. Product page: photos, size and colour, the story or verse behind it, benefit tags, size guide, related items
5. Hamper page: the hamper shown beside the items inside it
6. Bag (slide-out drawer) and checkout with gift wrap, personal note, delivery details and payment
7. Order confirmation and order tracking
8. About, contact, FAQ, shipping and returns, privacy, terms

**Admin**
1. Products: add and edit, photos, sizes, colours, stock per variant, price
2. Hampers: pick the products inside; stock follows the items
3. Collections and the recipient tiles
4. Orders: status, gift note, wrap flag, printable packing slip
5. Seasonal settings: switches for snowfall, countdown, Christmas hero, order-by banner; date fields for launch and order-by; ticker text
6. Home page content: hero text, featured collection, featured products

## 4. Signature features

- **Layered logo animation:** ring draws, sprigs grow, lid lifts, light and stars appear, "KALO" writes in. Used on the loader and, in a small form, in the header.
- **Hero gift:** floating gift and baubles that react to the pointer; tapping the gift opens a verse card.
- **Launch countdown** in the hero, rolling digits.
- **Gentle snowfall** that pauses when the tab is hidden and for visitors who prefer reduced motion.
- **Gold ribbon scroll progress line** under the header.
- **Sticky "Order by [date]" pill** with the remaining time.
- **Sideways-scrolling "moments" row** for the recipient cards.
- **Pressed-button and bounce micro-interactions**; bag counter bumps on add.

## 5. Build order

Each phase ends with something you can open and review.

1. **Foundation.** Project setup, colour and type tokens, header, footer, buttons, cards, ticker, grain. Layered logo rebuild and its animation.
2. **Home page.** Hero with gift, countdown and snow, recipient row, featured hampers, featured products, story section, FAQ. Sample products until real ones are entered.
3. **Catalogue.** Database tables, collection pages, product page with variants, hamper page.
4. **Bag and checkout.** Bag drawer, gift wrap and note, address form, Razorpay test payments, confirmation page and email.
5. **Admin.** Login, products, hampers, orders, seasonal switches, home page content.
6. **Finish.** Phone and tablet pass, speed, SEO, accessibility, legal pages, then go live on your domain.

## 6. What I need from you

**To start (phase 1): nothing more.**

**Before phase 3**
- Product list with names, prices, sizes, colours and photos (phone photos are fine to begin with)
- Which products go in which hampers

**Before phase 4**
- Launch date, and the order-by dates for Christmas delivery
- Where you deliver (all India or selected areas) and delivery charges
- Gift wrap price, if any
- Whether cash on delivery is offered
- A Razorpay account

**Before going live**
- Domain name
- Contact details (WhatsApp number, email, Instagram)
- Return and refund policy
- A larger version of the logo's box artwork for print use (not needed for the site)

## 7. Decisions (confirmed 2026-11-11)

1. **Personalisation.** No name printing. Products are sold as designed.
2. **Customer accounts.** No sign-up step. Checking out with a phone number creates the account automatically and stores the customer's details and orders against that number. Returning customers are recognised by phone number. Viewing saved details or past orders requires a one-time code sent to that phone, so nobody can see another person's address by typing their number.
3. **Logo tagline.** Keep "Artisanal gifts · made with heart".
4. **Payments last.** Razorpay is added at the very end. Phase 4 builds the bag and the checkout form without taking payment.
5. **Phone verification by WhatsApp.** Returning customers get a one-time code on WhatsApp from KALO's WhatsApp Business number (replaces SMS). Needs a Meta Business setup and an approved message template.
6. **Gift options on every item.** Gift wrap is Rs 50 per piece (not offered on hampers, which arrive packed). A handwritten card is Rs 50 per piece with a message of up to 250 characters. Both can be set on the product page and changed in the bag.
7. **Delivery areas and charges** are decided later.
