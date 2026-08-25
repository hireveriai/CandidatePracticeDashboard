import { NextResponse } from "next/server";
import { getOptionalCandidateId } from "@/lib/server/resume/auth";
import { listCandidateResumes } from "@/lib/server/resume/resume-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const candidateId = await getOptionalCandidateId();
    if (!candidateId) {
      return NextResponse.json({ ok: true, resumes: [] });
    }

    const resumes = await listCandidateResumes(candidateId);
    return NextResponse.json({ ok: true, resumes });
  } catch (error) {
    console.error("Resume list failed", error);
    return NextResponse.json(
      { ok: false, error: "RESUME_LIST_FAILED", message: "Could not load your resumes." },
      { status: 500 }
    );
  }
}
