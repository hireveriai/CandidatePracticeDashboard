import { NextResponse } from "next/server";
import { sendFreePracticeEmail } from "@/lib/server/email";
import {
  getPracticeEntitlementState,
  PracticeEntitlementError,
  requestFreePractice,
} from "@/lib/server/practice-entitlement";
import { applyDeviceCookie, getRequestOrigin } from "@/lib/server/request-origin";
import { getSessionIdentityId } from "@/lib/server/session";
import { query } from "@/lib/server/pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return response;
}

export async function GET() {
  const identityId = await getSessionIdentityId();
  const state = await getPracticeEntitlementState(identityId);
  return noStore(NextResponse.json({ ok: true, entitlement: state }));
}

export async function POST() {
  try {
    const identityId = await getSessionIdentityId();

    if (!identityId) {
      return NextResponse.json(
        {
          ok: false,
          error: "PRACTICE_SESSION_REQUIRED",
          message: "Please sign in to request your free practice interview.",
        },
        { status: 401 }
      );
    }

    const origin = await getRequestOrigin();
    const state = await requestFreePractice({ identityId, origin });

    if (state.status === "PENDING_REVIEW" || state.status === "APPROVED") {
      const { rows } = await query<{ email: string | null }>(
        `select lower(coalesce(primary_email, email)) as email from public.identity_users where identity_id = $1::uuid limit 1`,
        [identityId]
      ).catch(() => ({ rows: [] as Array<{ email: string | null }> }));

      const email = rows[0]?.email;
      if (email) {
        void sendFreePracticeEmail({
          to: email,
          status: state.status,
          requestId: state.requestId,
        });
      }
    }

    return applyDeviceCookie(
      noStore(NextResponse.json({ ok: true, entitlement: state })),
      origin
    ) as NextResponse;
  } catch (error) {
    if (error instanceof PracticeEntitlementError) {
      return NextResponse.json(
        { ok: false, error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error("Free practice request failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: "PRACTICE_REQUEST_FAILED",
        message: "Unable to process your request right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
