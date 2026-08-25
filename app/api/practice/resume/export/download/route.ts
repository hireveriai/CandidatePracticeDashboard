import { NextResponse } from "next/server";
import { ResumeAuthError, requireCandidateId } from "@/lib/server/resume/auth";
import { createSignedDownloadUrl } from "@/lib/server/resume/storage";
import { getExportForCandidate } from "@/lib/server/resume/resume-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { candidateId } = await requireCandidateId();
    const url = new URL(request.url);
    const exportId = url.searchParams.get("exportId") ?? "";
    const format = url.searchParams.get("format") === "docx" ? "docx" : "pdf";

    const exportRow = await getExportForCandidate(exportId, candidateId);
    if (!exportRow) {
      return NextResponse.json(
        { ok: false, error: "EXPORT_NOT_FOUND", message: "That export could not be found." },
        { status: 404 }
      );
    }

    if (!exportRow.isPaid) {
      return NextResponse.json(
        { ok: false, error: "PAYMENT_REQUIRED", message: "Unlock the download to get your enhanced resume." },
        { status: 402 }
      );
    }

    const key = format === "docx" ? exportRow.docxPath : exportRow.pdfPath;
    if (!key) {
      return NextResponse.json(
        { ok: false, error: "FILE_MISSING", message: "That file wasn't generated. Please contact support." },
        { status: 500 }
      );
    }

    const signedUrl = await createSignedDownloadUrl(key);
    return NextResponse.json({ ok: true, url: signedUrl });
  } catch (error) {
    if (error instanceof ResumeAuthError) {
      return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: error.status });
    }

    console.error("Resume export download failed", error);
    return NextResponse.json(
      { ok: false, error: "DOWNLOAD_FAILED", message: "Could not prepare your download. Please try again." },
      { status: 500 }
    );
  }
}
