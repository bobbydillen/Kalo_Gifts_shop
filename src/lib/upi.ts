/**
 * Paying by UPI straight into the shop's own UPI ID. A UPI payment link opens the customer's UPI app
 * with the shop's ID, the exact amount and the order number filled in; the same link as a QR code
 * works from a computer. Nothing here confirms a payment: the shop checks the money in its bank.
 */

/** Saved in the browser tab between checkout and the pay screen: { number, total, phone }. */
export const UPI_PAY_KEY = "kalo-upi-pay-v1";

export type UpiPayNote = { number: number; total: number; phone: string };

const params = (upiId: string, amount: number, orderNumber: number) =>
  new URLSearchParams({
    pa: upiId,
    pn: "KALO Gifts",
    am: amount.toFixed(2),
    cu: "INR",
    tn: `KALO order ${orderNumber}`,
  })
    .toString()
    .replace(/\+/g, "%20");

/** The standard UPI link (opens a chooser of UPI apps on Android; used for the QR code). */
export const upiLink = (upiId: string, amount: number, orderNumber: number) => `upi://pay?${params(upiId, amount, orderNumber)}`;

/** Links that open one particular app directly (needed on iPhones, where upi:// has no chooser). */
export const upiAppLinks = (upiId: string, amount: number, orderNumber: number) => {
  const q = params(upiId, amount, orderNumber);
  return [
    { name: "Google Pay", href: `tez://upi/pay?${q}` },
    { name: "PhonePe", href: `phonepe://pay?${q}` },
    { name: "Paytm", href: `paytmmp://pay?${q}` },
  ];
};
