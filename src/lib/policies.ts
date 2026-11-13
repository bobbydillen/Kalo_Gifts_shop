import { formatPrice } from "@/lib/catalog";
import type { SiteSettings } from "@/lib/settings";

/**
 * The text of the policy pages. The numbers people care about are named here so they are
 * changed in one place. Business details (name, address, contact) come from the admin settings.
 *
 * This is a careful first draft written for a small Indian online shop. It is not legal advice:
 * have it read by someone who knows your business before you rely on it.
 */

export const RETURN_DAYS = 7; // days after delivery to ask for a return or exchange
export const REPORT_HOURS = 48; // hours after delivery to report damage or a wrong item
export const DISPATCH_DAYS = "2 to 4"; // working days from confirmation to dispatch
export const DELIVERY_DAYS = "3 to 7"; // working days in transit after dispatch
export const REFUND_DAYS = "5 to 7"; // working days to refund once the return is checked
export const LAST_UPDATED = "13 November 2026";

export type Block = string | { list: string[] };
export type PolicySection = { title: string; body: Block[] };
export type Policy = {
  slug: string;
  title: string; // plain, for the tab and the footer
  heading: [before: string, emphasis: string]; // for the big heading, "Returns and" + "refunds"
  intro: string;
  sections: PolicySection[];
};

export const POLICY_LINKS = [
  { slug: "shipping", label: "Shipping and delivery" },
  { slug: "returns", label: "Returns and refunds" },
  { slug: "privacy", label: "Privacy policy" },
  { slug: "terms", label: "Terms and conditions" },
] as const;

/** Ways to reach the shop, only the ones that have been filled in. */
export function contactLines(s: SiteSettings): string[] {
  const out: string[] = [];
  if (s.whatsappNumber) out.push(`WhatsApp: +91 ${s.whatsappNumber}`);
  if (s.contactEmail) out.push(`Email: ${s.contactEmail}`);
  return out;
}

export function sellerLines(s: SiteSettings): string[] {
  const out: string[] = [];
  out.push(s.businessName || "KALO Gifts");
  if (s.businessAddress) out.push(...s.businessAddress.split("\n").map((l) => l.trim()).filter(Boolean));
  if (s.gstin) out.push(`GSTIN: ${s.gstin}`);
  return out;
}

export function getPolicy(slug: string, s: SiteSettings): Policy | undefined {
  const shop = s.businessName || "KALO Gifts";
  const contact = contactLines(s);
  const reach = contact.length ? contact.join(" · ") : "the contact details on our Contact page";

  switch (slug) {
    case "shipping":
      return {
        slug,
        title: "Shipping and delivery",
        heading: ["Shipping and", "delivery"],
        intro: "How and when your order reaches you, and what delivery costs.",
        sections: [
          {
            title: "Where we deliver",
            body: ["We deliver across India through trusted courier partners. We do not ship outside India at the moment."],
          },
          {
            title: "How long it takes",
            body: [
              `After you place an order we confirm it with you on WhatsApp. We then pack it and hand it to the courier, usually within ${DISPATCH_DAYS} working days of confirmation. Gifts with a handwritten card or other personal touches can take a little longer.`,
              `Once it is dispatched, delivery usually takes ${DELIVERY_DAYS} working days, depending on where you live. Remote areas can take longer. These are estimates, not promises, because couriers can be delayed by weather, festivals and local conditions.`,
              "For Christmas, order before the date shown on the website so that your gift arrives in time.",
            ],
          },
          {
            title: "What delivery costs",
            body: [
              `The delivery charge depends on where the parcel is going and how much it weighs. You see the exact amount at checkout, before you place the order. Orders with items worth ${formatPrice(s.freeShippingOver)} or more are delivered free.`,
            ],
          },
          {
            title: "Tracking your order",
            body: [
              "When your parcel is dispatched we share the courier name and a tracking number with you on WhatsApp, and they appear on your Account page if you signed in with the email you ordered with.",
            ],
          },
          {
            title: "Delivery problems",
            body: [
              {
                list: [
                  "Please give a full address, with a landmark and a working phone number. Couriers call before delivery.",
                  "If the courier cannot reach you they will try again. After several attempts the parcel may come back to us. We will contact you to send it again; the delivery charge may be asked for again.",
                  `If your parcel arrives damaged or you receive the wrong item, tell us within ${REPORT_HOURS} hours of delivery. Please film the unboxing or take clear photos of the parcel and the item. See our Returns and refunds page.`,
                  "If a parcel looks tampered with, please do not accept it, and message us straight away.",
                ],
              },
            ],
          },
          { title: "Questions", body: [`Write to us at ${reach}.`] },
        ],
      };

    case "returns":
      return {
        slug,
        title: "Returns and refunds",
        heading: ["Returns and", "refunds"],
        intro: "We want you to love what you ordered. If something is not right, we will sort it out together.",
        sections: [
          {
            title: "How to ask for a return or exchange",
            body: [
              "Chat with us on WhatsApp. Tell us your order number, what the problem is, and send photos if the item is damaged or wrong. You can start the chat from your Account page or from the Contact page; the order number is filled in for you.",
              "We look at every request by hand. If it is approved, we arrange the return with you and send the pickup details. There is no form to fill in and no need to book a courier yourself.",
            ],
          },
          {
            title: "When we accept returns",
            body: [
              {
                list: [
                  `You can ask for a return or exchange within ${RETURN_DAYS} days of delivery.`,
                  "The item must be unused, unwashed, in its original condition and packaging, with any tags attached.",
                  `Damaged, defective or wrong items: tell us within ${REPORT_HOURS} hours of delivery, with photos or an unboxing video. We replace the item, or refund you if we cannot.`,
                  "Size exchanges depend on stock. If your size is out of stock we will offer a refund.",
                ],
              },
            ],
          },
          {
            title: "What we cannot take back",
            body: [
              {
                list: [
                  "Items made or customised specially for you, unless they arrive damaged or wrong.",
                  "Items that have been worn, washed, used or damaged after delivery.",
                  "Gift wrapping and handwritten cards, which are not refunded separately.",
                  `Requests made after ${RETURN_DAYS} days from delivery.`,
                ],
              },
            ],
          },
          {
            title: "Cancelling an order",
            body: [
              "You can cancel before your order is dispatched. Chat with us as soon as you can; if it has already been dispatched, it becomes a return once it reaches you.",
            ],
          },
          {
            title: "Refunds",
            body: [
              `Once the returned item reaches us and we have checked it, we refund you within ${REFUND_DAYS} working days. The refund goes back to the way you paid. If you paid cash on delivery, we ask for your UPI or bank details and send it there.`,
              "The delivery charge is not refunded, unless the return is because of our mistake (a damaged or wrong item). Return pickup is arranged by us; we will tell you before if any charge applies.",
            ],
          },
          { title: "Need help?", body: [`Reach us at ${reach}.`] },
        ],
      };

    case "privacy":
      return {
        slug,
        title: "Privacy policy",
        heading: ["Privacy", "policy"],
        intro: `How ${shop} looks after your information.`,
        sections: [
          {
            title: "What we collect",
            body: [
              {
                list: [
                  "When you order: your name, phone number, email, delivery address, the items you ordered, and any note or card message you write.",
                  "When you sign in: your email address, to send you a one-time code. We do not use passwords for customers.",
                  "On your device: the contents of your bag are kept in your browser, and a sign-in session is kept while you are signed in. We do not use advertising trackers.",
                ],
              },
            ],
          },
          {
            title: "Why we use it",
            body: [
              {
                list: [
                  "To take, pack, deliver and support your order.",
                  "To message you about your order by WhatsApp and email.",
                  "To show you your past orders when you sign in.",
                  "To keep records that the law asks us to keep, and to prevent fraud and misuse.",
                ],
              },
              "We do not sell your information, and we do not send marketing messages unless you ask for them.",
            ],
          },
          {
            title: "Who it is shared with",
            body: [
              "Only the people who help us serve you: courier and shipping partners (they need your name, address and phone to deliver), our payment provider when payments are added (they handle your payment details; we never see your card or UPI PIN), and the technology services that run this website and store its data. They may only use your information for these purposes. We may also share information when the law requires it.",
            ],
          },
          {
            title: "How long we keep it",
            body: [
              "We keep order records for as long as needed to support you and to meet tax and accounting rules. You can ask us to delete your account details; we will do so unless we must keep them by law.",
            ],
          },
          {
            title: "Your choices",
            body: [
              `You can ask to see, correct or delete the information we hold about you, or withdraw your consent, by contacting us at ${reach}. We handle these requests in line with Indian law, including the Digital Personal Data Protection Act, 2023.`,
            ],
          },
          {
            title: "Keeping it safe",
            body: [
              "Your data is stored with a reputable database provider and sent over encrypted connections. No system is perfectly safe, but we limit who can see orders and we review access.",
            ],
          },
          {
            title: "Children",
            body: ["Our shop is meant for adults. If you are under 18, please ask a parent or guardian to order for you."],
          },
          {
            title: "Complaints",
            body: [
              s.grievanceOfficer
                ? `If you have a concern about your information, contact ${s.grievanceOfficer} at ${reach}.`
                : `If you have a concern about your information, contact us at ${reach}.`,
            ],
          },
          {
            title: "Changes",
            body: [`We may update this policy. The date at the top shows when it last changed (${LAST_UPDATED}).`],
          },
        ],
      };

    case "terms":
      return {
        slug,
        title: "Terms and conditions",
        heading: ["Terms and", "conditions"],
        intro: "The simple rules for using this website and buying from us.",
        sections: [
          {
            title: "About us",
            body: [`This website is run by ${shop}. By using it or placing an order you agree to these terms.`],
          },
          {
            title: "Your order",
            body: [
              "When you place an order you are asking to buy; it is not accepted until we confirm it, usually on WhatsApp. We may decline or cancel an order, for example if an item is out of stock, a price or description is wrong, or we cannot deliver to your address. If we cancel after you have paid, we refund you in full.",
              "Please check your details before ordering. We are not responsible for delays or failed deliveries caused by a wrong address or phone number.",
            ],
          },
          {
            title: "Prices and payment",
            body: [
              "All prices are in Indian rupees. Gift wrap, handwritten cards and delivery are shown separately at checkout and are included in the total you pay. We may change prices at any time, but not for an order we have already confirmed.",
              "Ways to pay are shown at checkout or shared with you when we confirm your order.",
            ],
          },
          {
            title: "Products",
            body: [
              "We try to show our products as accurately as we can. Colours can look a little different on different screens, and handmade or printed pieces can vary slightly. Sizes follow the size guide on each product page.",
            ],
          },
          {
            title: "Delivery, returns and refunds",
            body: ["Please read our Shipping and delivery policy and our Returns and refunds policy. They are part of these terms."],
          },
          {
            title: "Gift messages",
            body: [
              "Please keep handwritten card messages kind and lawful. We may decline a message that is abusive, hateful or illegal, and we will tell you before we do.",
            ],
          },
          {
            title: "Our designs",
            body: [
              `The designs, artwork, logo, words and photos on this website belong to ${shop} or its licensors. You may not copy or use them for business without our written permission.`,
            ],
          },
          {
            title: "Using the website",
            body: [
              "Please do not misuse the website: no attempts to break it, overload it, or look at other people's information.",
            ],
          },
          {
            title: "Our responsibility",
            body: [
              "We take care to give you a good product and service. To the extent the law allows, we are not responsible for losses that we could not have reasonably predicted, and our responsibility for any order is limited to the amount you paid for it. Nothing here takes away rights you have under Indian consumer law.",
            ],
          },
          {
            title: "Governing law",
            body: [
              "These terms are governed by the laws of India. Disputes will be handled by the courts at the place of our registered address, after we have first tried to settle the matter with you directly.",
            ],
          },
          {
            title: "Changes and contact",
            body: [`We may update these terms; the date at the top shows the latest version (${LAST_UPDATED}). Questions? Reach us at ${reach}.`],
          },
        ],
      };

    default:
      return undefined;
  }
}
