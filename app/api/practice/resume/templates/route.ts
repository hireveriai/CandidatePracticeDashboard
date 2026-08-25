import { NextResponse } from "next/server";
import { resolveCurrencyFromCountry } from "@/lib/server/currency";
import { getExportPriceMinor } from "@/lib/server/resume/payment";
import { RESUME_TEMPLATES } from "@/lib/server/resume/templates";

export const runtime = "nodejs";

function getRequestCountry(request: Request) {
  return (
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-country-code") ||
    "IN"
  ).toUpperCase();
}

export async function GET(request: Request) {
  const currency = resolveCurrencyFromCountry(getRequestCountry(request));

  return NextResponse.json({
    ok: true,
    templates: RESUME_TEMPLATES,
    pricing: {
      currency,
      standard: getExportPriceMinor("standard", currency),
      premium: getExportPriceMinor("premium", currency),
    },
  });
}
