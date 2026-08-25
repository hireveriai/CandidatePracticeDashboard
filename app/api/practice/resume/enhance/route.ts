import { NextResponse } from "next/server";
import { ResumeAuthError, requireCandidateId } from "@/lib/server/resume/auth";
import { ResumeAIError } from "@/lib/server/resume/openai";
import { generateAiOnlyEnhancement, generateInterviewInsightEnhancement, OPENAI_MODEL } from "@/lib/server/resume/enhancement";
import { getInterviewTranscriptAndReport } from "@/lib/server/resume/interview-source";
import {
  createEnhancementSession,
  findReusableSession,
  getCandidateResume,
  listSuggestions,
  markSessionFailed,
  markSessionReady,
  saveSuggestions,
} from "@/lib/server/resume/resume-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let candidateId: string;

  try {
    ({ candidateId } = await requireCandidateId());
  } catch (error) {
    if (error instanceof ResumeAuthError) {
      return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: error.status });
    }
    throw error;
  }

  try {
    const body = await request.json().catch(() => ({}) as Record<string, unknown>);
    const sourceResumeId = String(body.sourceResumeId ?? "");
    const mode = body.mode === "interview_enhancement" ? "interview_enhancement" : "ai_enhancement";
    const interviewAttemptId = mode === "interview_enhancement" ? String(body.interviewAttemptId ?? "") : null;
    const forceRegenerate = Boolean(body.forceRegenerate);

    if (!sourceResumeId) {
      return NextResponse.json(
        { ok: false, error: "RESUME_REQUIRED", message: "Choose a resume to enhance." },
        { status: 400 }
      );
    }

    if (mode === "interview_enhancement" && !interviewAttemptId) {
      return NextResponse.json(
        { ok: false, error: "INTERVIEW_REQUIRED", message: "Choose a completed practice interview to use." },
        { status: 400 }
      );
    }

    const sourceResume = await getCandidateResume(sourceResumeId, candidateId);
    if (!sourceResume) {
      return NextResponse.json(
        { ok: false, error: "RESUME_NOT_FOUND", message: "That resume could not be found." },
        { status: 404 }
      );
    }

    if (!forceRegenerate) {
      const existing = await findReusableSession({
        candidateId,
        sourceResumeId,
        enhancementType: mode,
        interviewAttemptId,
      });

      if (existing) {
        const suggestions = await listSuggestions(existing.sessionId);
        return NextResponse.json({ ok: true, session: existing, suggestions, reused: true });
      }
    }

    const sessionId = await createEnhancementSession({
      candidateId,
      sourceResumeId,
      enhancementType: mode,
      interviewAttemptId,
    });

    try {
      let result;

      if (mode === "ai_enhancement") {
        result = await generateAiOnlyEnhancement(sourceResume.structuredData);
      } else {
        const transcriptAndReport = await getInterviewTranscriptAndReport(interviewAttemptId!, candidateId);
        if (!transcriptAndReport) {
          await markSessionFailed(sessionId, "No usable transcript found for this interview.");
          return NextResponse.json(
            {
              ok: false,
              error: "TRANSCRIPT_UNAVAILABLE",
              message: "This interview doesn't have enough transcript data available yet to use for insights.",
            },
            { status: 422 }
          );
        }

        result = await generateInterviewInsightEnhancement({
          resume: sourceResume.structuredData,
          transcriptExcerpt: transcriptAndReport.transcriptExcerpt,
          interviewReport: transcriptAndReport.report,
        });
      }

      await saveSuggestions(sessionId, result.suggestions);
      await markSessionReady(sessionId, {
        model: OPENAI_MODEL,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      });

      const suggestions = await listSuggestions(sessionId);
      return NextResponse.json({
        ok: true,
        session: { sessionId, candidateId, sourceResumeId, enhancementType: mode, interviewAttemptId, status: "ready_for_review" },
        suggestions,
        reused: false,
      });
    } catch (error) {
      const message = error instanceof ResumeAIError ? error.message : "AI analysis failed. Please try again.";
      await markSessionFailed(sessionId, message);
      const status = error instanceof ResumeAIError && error.code === "OPENAI_TIMEOUT" ? 504 : 502;
      return NextResponse.json({ ok: false, error: "ENHANCEMENT_FAILED", message }, { status });
    }
  } catch (error) {
    console.error("Resume enhancement request failed", error);
    return NextResponse.json(
      { ok: false, error: "ENHANCEMENT_REQUEST_FAILED", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
