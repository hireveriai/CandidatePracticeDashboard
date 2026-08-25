import { createHmac, timingSafeEqual } from "crypto";
import Razorpay from "razorpay";
import type { CurrencyCode } from "@/lib/server/currency";
import type { PricingTier } from "./templates";

export type ExportCurrency = CurrencyCode;

/**
 * Resume export price list, in minor currency units (paise/cents/pence).
 * Localized commercial prices, not FX conversions of one another. The server
 * is always the source of truth for these amounts -- a price sent from the
 * client is never trusted.
 */
const EXPORT_PRICE_MINOR: Record<PricingTier, Record<ExportCurrency, number>> = {
  standard: {
    INR: 9900, // ₹99
    USD: 299, // $2.99
    GBP: 249, // £2.49
    EUR: 299, // €2.99
  },
  premium: {
    INR: 14900, // ₹149
    USD: 499, // $4.99
    GBP: 399, // £3.99
    EUR: 499, // €4.99
  },
};

export function getExportPriceMinor(tier: PricingTier, currency: ExportCurrency) {
  return EXPORT_PRICE_MINOR[tier][currency];
}

function getRazorpayKeyId() {
  const key = process.env.RAZORPAY_KEY_ID?.trim();
  if (!key) throw new Error("RAZORPAY_KEY_ID is not configured");
  return key;
}

function getRazorpayKeySecret() {
  const key = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!key) throw new Error("RAZORPAY_KEY_SECRET is not configured");
  return key;
}

let razorpayClient: Razorpay | null = null;

function getRazorpayClient() {
  if (!razorpayClient) {
    razorpayClient = new Razorpay({ key_id: getRazorpayKeyId(), key_secret: getRazorpayKeySecret() });
  }
  return razorpayClient;
}

export async function createResumeExportOrder(input: { exportId: string; amountMinor: number; currency: ExportCurrency }) {
  const razorpay = getRazorpayClient();

  const order = (await razorpay.orders.create({
    amount: input.amountMinor,
    currency: input.currency,
    receipt: `resume-export-${input.exportId}`.slice(0, 40),
    notes: { export_id: input.exportId, product: "resume_enhancement_export" },
  })) as { id?: string };

  if (!order.id) {
    throw new Error("Razorpay did not return an order id");
  }

  return order.id;
}

export function verifyRazorpaySignature(input: { orderId: string; paymentId: string; signature: string }) {
  const expected = createHmac("sha256", getRazorpayKeySecret()).update(`${input.orderId}|${input.paymentId}`).digest("hex");
  const received = input.signature.trim();

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}
