import { NextResponse } from "next/server";
import { ResumeAuthError, requireCandidateId } from "@/lib/server/resume/auth";
import { getCandidateResume, setCurrentResume } from "@/lib/server/resume/resume-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { candidateId } = await requireCandidateId();
    const body = await request.json().catch(() => ({}) as Record<string, unknown>);
    const resumeId = String(body.resumeId ?? "");

    const resume = await getCandidateResume(resumeId, candidateId);
    if (!resume) {
      return NextResponse.json(
        { ok: false, error: "RESUME_NOT_FOUND", message: "That resume could not be found." },
        { status: 404 }
      );
    }

    await setCurrentResume(resumeId, candidateId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ResumeAuthError) {
      return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: error.status });
    }

    console.error("Set current resume failed", error);
    return NextResponse.json(
      { ok: false, error: "SET_CURRENT_FAILED", message: "Could not update your current resume." },
      { status: 500 }
    );
  }
}
