import { NextRequest, NextResponse } from "next/server";
import { createPracticeInterview } from "@/lib/server/practice-candidate";
import {
  consumePracticeInterviewCredit,
  getPracticeSubscription,
} from "@/lib/server/practice-pricing";
import { getSessionIdentityId } from "@/lib/server/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionIdentityId = await getSessionIdentityId();
    const identityId = sessionIdentityId || String(body.identityId ?? "");
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

    if (sessionIdentityId) {
      const subscription = await getPracticeSubscription(sessionIdentityId);
      if (
        !subscription ||
        subscription.status !== "active" ||
        subscription.remainingCredits < 1
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: "PRACTICE_SUBSCRIPTION_REQUIRED",
            message: "Please choose a practice plan before starting a mock interview.",
          },
          { status: 402 }
        );
      }
    }

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

    if (sessionIdentityId) {
      await consumePracticeInterviewCredit(sessionIdentityId);
    }

    return NextResponse.json({ ok: true, interview });
  } catch (error) {
    if (error instanceof Error && error.message === "PRACTICE_SUBSCRIPTION_REQUIRED") {
      return NextResponse.json(
        {
          ok: false,
          error: "PRACTICE_SUBSCRIPTION_REQUIRED",
          message: "Please choose a practice plan before starting a mock interview.",
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
