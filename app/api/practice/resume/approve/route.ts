import { NextResponse } from "next/server";
import { ResumeAuthError, requireCandidateId } from "@/lib/server/resume/auth";
import { applyAcceptedSuggestions } from "@/lib/server/resume/resume-apply";
import {
  createDerivedResume,
  getCandidateResume,
  getSession,
  listSuggestions,
  markSessionApproved,
} from "@/lib/server/resume/resume-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { candidateId } = await requireCandidateId();
    const body = await request.json().catch(() => ({}) as Record<string, unknown>);
    const sessionId = String(body.sessionId ?? "");

    const session = await getSession(sessionId, candidateId);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "SESSION_NOT_FOUND", message: "That enhancement session could not be found." },
        { status: 404 }
      );
    }

    if (session.status !== "ready_for_review" && session.status !== "approved") {
      return NextResponse.json(
        { ok: false, error: "SESSION_NOT_READY", message: "This session isn't ready to approve yet." },
        { status: 409 }
      );
    }

    const sourceResume = await getCandidateResume(session.sourceResumeId, candidateId);
    if (!sourceResume) {
      return NextResponse.json(
        { ok: false, error: "RESUME_NOT_FOUND", message: "The source resume could not be found." },
        { status: 404 }
      );
    }

    const suggestions = await listSuggestions(sessionId);
    const accepted = suggestions.filter((suggestion) => suggestion.decision === "accepted");
    const finalResume = applyAcceptedSuggestions(sourceResume.structuredData, accepted);

    const newResumeId = await createDerivedResume({
      candidateId,
      parentResumeId: sourceResume.resumeId,
      enhancementType: session.enhancementType,
      structuredData: finalResume,
    });

    await markSessionApproved(sessionId);

    return NextResponse.json({ ok: true, resumeId: newResumeId, resume: finalResume });
  } catch (error) {
    if (error instanceof ResumeAuthError) {
      return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: error.status });
    }

    console.error("Resume approve/generate failed", error);
    return NextResponse.json(
      { ok: false, error: "APPROVE_FAILED", message: "Could not generate your enhanced resume. Please try again." },
      { status: 500 }
    );
  }
}
