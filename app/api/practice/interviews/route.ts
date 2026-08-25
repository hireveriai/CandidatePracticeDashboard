import { NextRequest, NextResponse } from "next/server";
import { createPracticeInterview } from "@/lib/server/practice-candidate";
import {
  assertCanStartPracticeInterview,
  PracticeEntitlementError,
} from "@/lib/server/practice-entitlement";
import { consumePracticeInterviewCredit } from "@/lib/server/practice-pricing";
import { getSessionIdentityId } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // The identity always comes from the session cookie. It used to fall back
    // to a caller-supplied body field, which let an unauthenticated request
    // create interviews for any identity and skip the credit check entirely.
    const identityId = await getSessionIdentityId();

    if (!identityId) {
      return NextResponse.json(
        {
          ok: false,
          error: "PRACTICE_SESSION_REQUIRED",
          message: "Please sign in to start a practice interview.",
        },
        { status: 401 }
      );
    }

    const role = String(body.role ?? "").trim();

    if (!role) {
      return NextResponse.json(
        {
          ok: false,
          error: "PRACTICE_ROLE_REQUIRED",
          message: "Enter the role you want to practice for.",
        },
        { status: 400 }
      );
    }

    // Server-side entitlement gate. An approved free credit or a paid credit
    // is required before anything is created.
    await assertCanStartPracticeInterview(identityId);

    // Spend the credit BEFORE creating the interview, so a burst of concurrent
    // requests can only produce as many interviews as there are credits.
    const consumption = await consumePracticeInterviewCredit(identityId);

    try {
      const interview = await createPracticeInterview({
        identityId,
        email: body.email ? String(body.email) : undefined,
        fullName: body.fullName ? String(body.fullName) : undefined,
        role,
        experience: String(body.experience ?? "Mid level"),
        difficulty: String(body.difficulty ?? "Standard"),
        interviewType: String(body.interviewType ?? "Mixed"),
        language: String(body.language ?? "English"),
        duration: String(body.duration ?? "30 minutes"),
        coding: Boolean(body.coding),
      });

      return NextResponse.json({
        ok: true,
        interview,
        credits: {
          remaining: consumption.remainingCredits,
          usedFreeCredit: consumption.usedFreeCredit,
        },
      });
    } catch (creationError) {
      // Interview creation failed after the credit was spent: give it back.
      await refundPracticeCredit(consumption.subscriptionId).catch((refundError) => {
        console.error("Practice credit refund failed", refundError);
      });
      throw creationError;
    }
  } catch (error) {
    if (error instanceof PracticeEntitlementError) {
      return NextResponse.json(
        { ok: false, error: error.code, message: error.message },
        { status: error.status }
      );
    }

    if (error instanceof Error && error.message === "PRACTICE_SUBSCRIPTION_REQUIRED") {
      return NextResponse.json(
        {
          ok: false,
          error: "PRACTICE_ENTITLEMENT_REQUIRED",
          message: "Request your free practice interview or choose a practice plan to get started.",
        },
        { status: 402 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "PRACTICE_INTERVIEW_CREATE_FAILED",
        message: error instanceof Error ? error.message : "Unable to create practice interview",
      },
      { status: 500 }
    );
  }
}

async function refundPracticeCredit(subscriptionId: string) {
  const { query } = await import("@/lib/server/pg");
  await query(
    `
      update public.hireveri_user_subscriptions
      set "totalCredits" = "totalCredits" + 1,
          "usedCredits" = greatest(coalesce("usedCredits", 0) - 1, 0),
          "updatedAt" = now()
      where "id" = $1::text
    `,
    [subscriptionId]
  );
}
