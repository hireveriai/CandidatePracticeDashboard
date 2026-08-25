import { NextResponse } from "next/server";
import { getSessionIdentityId } from "@/lib/server/session";
import { ensurePracticeCandidate } from "@/lib/server/practice-candidate";
import { getResumeFileKind, isSupportedResumeFile, extractResumeText } from "@/lib/server/resume/resume-file";
import { structureResumeText } from "@/lib/server/resume/enhancement";
import { ResumeAIError } from "@/lib/server/resume/openai";
import { createOriginalResume } from "@/lib/server/resume/resume-store";
import { uploadCandidateFile, ResumeStorageError } from "@/lib/server/resume/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const identityId = await getSessionIdentityId();
    if (!identityId) {
      return NextResponse.json(
        { ok: false, error: "SESSION_REQUIRED", message: "Please sign in to upload a resume." },
        { status: 401 }
      );
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "FILE_REQUIRED", message: "Choose a resume file to upload." },
        { status: 400 }
      );
    }

    if (!isSupportedResumeFile(file)) {
      return NextResponse.json(
        { ok: false, error: "UNSUPPORTED_FORMAT", message: "Please upload a PDF or DOCX resume." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { ok: false, error: "FILE_TOO_LARGE", message: "Resume files must be under 8 MB." },
        { status: 400 }
      );
    }

    const candidate = await ensurePracticeCandidate({ identityId });
    const buffer = Buffer.from(await file.arrayBuffer());

    let rawText: string | null;
    try {
      rawText = await extractResumeText(file, buffer);
    } catch (error) {
      console.error("Resume text extraction failed", error);
      return NextResponse.json(
        {
          ok: false,
          error: "PARSE_FAILED",
          message: "We couldn't read this resume file. Try a different PDF or DOCX export.",
        },
        { status: 422 }
      );
    }

    if (!rawText || !rawText.trim()) {
      return NextResponse.json(
        { ok: false, error: "EMPTY_RESUME", message: "This file doesn't appear to contain readable resume text." },
        { status: 422 }
      );
    }

    let structuredData;
    try {
      structuredData = await structureResumeText(rawText);
    } catch (error) {
      const message = error instanceof ResumeAIError ? error.message : "Could not analyze this resume right now.";
      console.error("Resume structuring failed", error);
      return NextResponse.json({ ok: false, error: "STRUCTURE_FAILED", message }, { status: 502 });
    }

    let uploaded;
    try {
      uploaded = await uploadCandidateFile({
        candidateId: candidate.candidateId,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        buffer,
        subdir: "uploads",
      });
    } catch (error) {
      const message = error instanceof ResumeStorageError ? error.message : "Could not store this resume.";
      console.error("Resume upload to storage failed", error);
      return NextResponse.json({ ok: false, error: "STORAGE_FAILED", message }, { status: 502 });
    }

    const resumeId = await createOriginalResume({
      candidateId: candidate.candidateId,
      filePath: uploaded.key,
      fileType: getResumeFileKind(file),
      rawText,
      structuredData,
    });

    return NextResponse.json({ ok: true, resumeId });
  } catch (error) {
    console.error("Resume upload failed", error);
    return NextResponse.json(
      { ok: false, error: "UPLOAD_FAILED", message: "Something went wrong uploading your resume. Please try again." },
      { status: 500 }
    );
  }
}
