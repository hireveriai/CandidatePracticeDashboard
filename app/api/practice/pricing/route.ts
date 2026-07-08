import { NextResponse } from "next/server";
import { getPracticePricing } from "@/lib/server/practice-pricing";
import { getSessionIdentityId } from "@/lib/server/session";

export async function GET() {
  try {
    const identityId = await getSessionIdentityId();
    const pricing = await getPracticePricing(identityId);
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
