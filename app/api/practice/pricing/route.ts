import { NextResponse } from "next/server";
import { resolveCurrencyFromCountry } from "@/lib/server/currency";
import { getPracticePricing } from "@/lib/server/practice-pricing";
import { getSessionIdentityId } from "@/lib/server/session";

export async function GET(request: Request) {
  try {
    const identityId = await getSessionIdentityId();
    const country = (request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || "IN").toUpperCase();
    const pricing = await getPracticePricing(identityId, resolveCurrencyFromCountry(country));
    return NextResponse.json({ ok: true, ...pricing });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "PRACTICE_PRICING_FAILED",
        message: error instanceof Error ? error.message : "Unable to load practice pricing",
      },
      { status: 500 }
    );
  }
}
