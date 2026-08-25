import { NextResponse } from "next/server";
import { getOptionalCandidateId } from "@/lib/server/resume/auth";
import { getEligibleInterviewsForCandidate } from "@/lib/server/resume/interview-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const candidateId = await getOptionalCandidateId();
    if (!candidateId) {
      return NextResponse.json({ ok: true, interviews: [] });
    }

    const interviews = await getEligibleInterviewsForCandidate(candidateId);
    return NextResponse.json({ ok: true, interviews });
  } catch (error) {
    console.error("Eligible interviews lookup failed", error);
    return NextResponse.json(
      { ok: false, error: "INTERVIEWS_LOOKUP_FAILED", message: "Could not load your interview sessions." },
      { status: 500 }
    );
  }
}
