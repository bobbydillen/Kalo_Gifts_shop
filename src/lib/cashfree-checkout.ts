"use client";

import type { PaymentSession } from "@/lib/online-payment";

/** Saved in the browser tab while paying online: { number, total, phone }, so a failed payment can be retried. */
export const ONLINE_PAY_KEY = "kalo-online-pay-v1";
export type OnlinePayNote = { number: number; total: number; phone: string };

type CashfreeSdk = { checkout: (o: { paymentSessionId: string; redirectTarget?: string }) => Promise<unknown> };
declare global {
  interface Window {
    Cashfree?: (o: { mode: string }) => CashfreeSdk;
  }
}

let loading: Promise<void> | null = null;

function loadSdk() {
  if (window.Cashfree) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("The payment page could not load."));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** Sends the customer to Cashfree's payment page; they come back to the order page when done. */
export async function openCashfree(session: PaymentSession) {
  await loadSdk();
  if (!window.Cashfree) throw new Error("The payment page could not load.");
  await window.Cashfree({ mode: session.mode }).checkout({ paymentSessionId: session.sessionId, redirectTarget: "_self" });
}
