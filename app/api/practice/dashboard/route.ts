import { NextRequest, NextResponse } from "next/server";
import { getPracticeDashboard } from "@/lib/server/practice-candidate";
import { getSessionIdentityId } from "@/lib/server/session";

export async function GET(request: NextRequest) {
  try {
    const identityId =
      request.nextUrl.searchParams.get("identityId") ??
      (await getSessionIdentityId()) ??
      undefined;
    const data = await getPracticeDashboard(identityId);
    return NextResponse.json({ ok: true, ...data });
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
