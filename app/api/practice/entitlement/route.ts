import { NextResponse } from "next/server";
import { sendFreePracticeEmail, sendPracticeReviewRequestEmail } from "@/lib/server/email";
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

function readText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export async function POST(request: Request) {
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

    const body = await request.json().catch(() => ({}) as Record<string, unknown>);
    const fullName = readText(body?.fullName, 120);
    const phone = readText(body?.phone, 40);
    const currentRole = readText(body?.currentRole, 120);
    const message = readText(body?.message, 1000);

    const origin = await getRequestOrigin();
    const state = await requestFreePractice({ identityId, origin });

    const { rows } = await query<{ email: string | null }>(
      `select lower(coalesce(primary_email, email)) as email from public.identity_users where identity_id = $1::uuid limit 1`,
      [identityId]
    ).catch(() => ({ rows: [] as Array<{ email: string | null }> }));

    const email = rows[0]?.email ?? null;

    if (state.status === "PENDING_REVIEW" || state.status === "APPROVED") {
      if (email) {
        void sendFreePracticeEmail({
          to: email,
          status: state.status,
          requestId: state.requestId,
        });
      }

      void sendPracticeReviewRequestEmail({
        candidateEmail: email,
        requestId: state.requestId,
        status: state.status,
        fullName,
        phone,
        currentRole,
        message,
      });
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
