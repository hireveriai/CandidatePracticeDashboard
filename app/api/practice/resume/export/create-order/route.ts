import { NextResponse } from "next/server";
import { ResumeAuthError, requireCandidateId } from "@/lib/server/resume/auth";
import { createResumeExportOrder, type ExportCurrency } from "@/lib/server/resume/payment";
import { getExportForCandidate, setExportOrder } from "@/lib/server/resume/resume-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { candidateId } = await requireCandidateId();
    const body = await request.json().catch(() => ({}) as Record<string, unknown>);
    const exportId = String(body.exportId ?? "");

    const exportRow = await getExportForCandidate(exportId, candidateId);
    if (!exportRow) {
      return NextResponse.json(
        { ok: false, error: "EXPORT_NOT_FOUND", message: "That export could not be found." },
        { status: 404 }
      );
    }

    if (exportRow.isPaid) {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    if (exportRow.razorpayOrderId) {
      return NextResponse.json({
        ok: true,
        orderId: exportRow.razorpayOrderId,
        amount: exportRow.priceAmountMinor,
        currency: exportRow.currency,
      });
    }

    const orderId = await createResumeExportOrder({
      exportId: exportRow.exportId,
      amountMinor: exportRow.priceAmountMinor,
      currency: exportRow.currency as ExportCurrency,
    });

    await setExportOrder(exportId, orderId);

    return NextResponse.json({
      ok: true,
      orderId,
      amount: exportRow.priceAmountMinor,
      currency: exportRow.currency,
    });
  } catch (error) {
    if (error instanceof ResumeAuthError) {
      return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: error.status });
    }

    console.error("Resume export order creation failed", error);
    return NextResponse.json(
      { ok: false, error: "ORDER_FAILED", message: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
