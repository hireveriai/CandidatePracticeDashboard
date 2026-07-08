import { NextRequest, NextResponse } from "next/server";
import { createPracticeInterview } from "@/lib/server/practice-candidate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const interview = await createPracticeInterview({
      identityId: String(body.identityId ?? ""),
      email: body.email ? String(body.email) : undefined,
      fullName: body.fullName ? String(body.fullName) : undefined,
      role: String(body.role ?? "Product Manager"),
      experience: String(body.experience ?? "Mid level"),
      difficulty: String(body.difficulty ?? "Standard"),
      interviewType: String(body.interviewType ?? "Mixed"),
      language: String(body.language ?? "English"),
      duration: String(body.duration ?? "30 minutes"),
      coding: Boolean(body.coding),
    });

    return NextResponse.json({ ok: true, interview });
  } catch (error) {
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
