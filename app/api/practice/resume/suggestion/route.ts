import { NextResponse } from "next/server";
import { ResumeAuthError, requireCandidateId } from "@/lib/server/resume/auth";
import { getSession, setAllSuggestionDecisions, setSuggestionDecision } from "@/lib/server/resume/resume-store";

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

    if (body.applyToAll === true) {
      const decision = body.decision === "rejected" ? "rejected" : "accepted";
      await setAllSuggestionDecisions(sessionId, decision);
      return NextResponse.json({ ok: true });
    }

    const suggestionId = String(body.suggestionId ?? "");
    const decision = body.decision === "rejected" ? "rejected" : "accepted";

    if (!suggestionId) {
      return NextResponse.json(
        { ok: false, error: "SUGGESTION_REQUIRED", message: "No suggestion specified." },
        { status: 400 }
      );
    }

    await setSuggestionDecision({ suggestionId, sessionId, decision });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ResumeAuthError) {
      return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: error.status });
    }

    console.error("Suggestion decision failed", error);
    return NextResponse.json(
      { ok: false, error: "SUGGESTION_UPDATE_FAILED", message: "Could not save your decision." },
      { status: 500 }
    );
  }
}
