import { NextResponse } from "next/server";
import { resolveCurrencyFromCountry } from "@/lib/server/currency";
import { ResumeAuthError, requireCandidateId } from "@/lib/server/resume/auth";
import { getExportPriceMinor } from "@/lib/server/resume/payment";
import { renderResumeDocx } from "@/lib/server/resume/render-docx";
import { renderResumePdf } from "@/lib/server/resume/render-pdf";
import {
  createExport,
  findExportByResumeAndTemplate,
  getCandidateResume,
  getExportForCandidate,
  setExportFiles,
} from "@/lib/server/resume/resume-store";
import { getTemplate } from "@/lib/server/resume/templates";
import { uploadCandidateFile } from "@/lib/server/resume/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRequestCountry(request: Request) {
  return (
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-country-code") ||
    "IN"
  ).toUpperCase();
}

/**
 * Renders and stores the PDF/DOCX for a chosen resume version + template.
 * The pricing tier -- and therefore the amount charged later -- is derived
 * entirely from the server-side template catalog, never from the client.
 */
export async function POST(request: Request) {
  try {
    const { candidateId } = await requireCandidateId();
    const body = await request.json().catch(() => ({}) as Record<string, unknown>);
    const resumeId = String(body.resumeId ?? "");
    const sessionId = String(body.sessionId ?? "");
    const templateId = String(body.templateId ?? "");

    const template = getTemplate(templateId);
    if (!template) {
      return NextResponse.json(
        { ok: false, error: "TEMPLATE_NOT_FOUND", message: "Choose a valid resume template." },
        { status: 400 }
      );
    }

    const resume = await getCandidateResume(resumeId, candidateId);
    if (!resume) {
      return NextResponse.json(
        { ok: false, error: "RESUME_NOT_FOUND", message: "That resume could not be found." },
        { status: 404 }
      );
    }

    const existingExportId = await findExportByResumeAndTemplate(resumeId, templateId);
    if (existingExportId) {
      const existing = await getExportForCandidate(existingExportId, candidateId);
      if (existing) {
        return NextResponse.json({
          ok: true,
          exportId: existing.exportId,
          price: { amountMinor: existing.priceAmountMinor, currency: existing.currency },
          tier: existing.pricingTier,
          alreadyPaid: existing.isPaid,
        });
      }
    }

    const [pdfBuffer, docxBuffer] = await Promise.all([
      renderResumePdf(resume.structuredData, template),
      renderResumeDocx(resume.structuredData, template),
    ]);

    const [pdfUpload, docxUpload] = await Promise.all([
      uploadCandidateFile({
        candidateId,
        fileName: "resume.pdf",
        contentType: "application/pdf",
        buffer: pdfBuffer,
        subdir: `exports/${resumeId}/${templateId}`,
      }),
      uploadCandidateFile({
        candidateId,
        fileName: "resume.docx",
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: docxBuffer,
        subdir: `exports/${resumeId}/${templateId}`,
      }),
    ]);

    const currency = resolveCurrencyFromCountry(getRequestCountry(request));
    const priceAmountMinor = getExportPriceMinor(template.tier, currency);

    const exportId = await createExport({
      sessionId,
      candidateResumeId: resumeId,
      priceAmountMinor,
      currency,
      templateId: template.id,
      pricingTier: template.tier,
    });

    await setExportFiles(exportId, pdfUpload.key, docxUpload.key);

    return NextResponse.json({
      ok: true,
      exportId,
      price: { amountMinor: priceAmountMinor, currency },
      tier: template.tier,
      alreadyPaid: false,
    });
  } catch (error) {
    if (error instanceof ResumeAuthError) {
      return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: error.status });
    }

    console.error("Resume export creation failed", error);
    return NextResponse.json(
      { ok: false, error: "EXPORT_CREATE_FAILED", message: "Could not prepare your resume files. Please try again." },
      { status: 500 }
    );
  }
}
