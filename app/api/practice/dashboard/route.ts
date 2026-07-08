import { NextRequest, NextResponse } from "next/server";
import { getPracticeDashboard } from "@/lib/server/practice-candidate";
import { getPracticePricing } from "@/lib/server/practice-pricing";
import { getSessionIdentityId } from "@/lib/server/session";

export async function GET(request: NextRequest) {
  try {
    const identityId =
      request.nextUrl.searchParams.get("identityId") ??
      (await getSessionIdentityId()) ??
      undefined;
    const [data, pricing] = await Promise.all([
      getPracticeDashboard(identityId),
      getPracticePricing(identityId),
    ]);
    return NextResponse.json({ ok: true, ...data, pricing });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "PRACTICE_DASHBOARD_FAILED",
        message: error instanceof Error ? error.message : "Unable to load practice dashboard",
      },
      { status: 500 }
    );
  }
}
