import { NextResponse } from "next/server";
import { ResumeAuthError, requireCandidateId } from "@/lib/server/resume/auth";
import { verifyRazorpaySignature } from "@/lib/server/resume/payment";
import { getExportForCandidate, markExportPaid } from "@/lib/server/resume/resume-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { candidateId } = await requireCandidateId();
    const body = await request.json().catch(() => ({}) as Record<string, unknown>);
    const exportId = String(body.exportId ?? "");
    const razorpayOrderId = String(body.razorpay_order_id ?? "");
    const razorpayPaymentId = String(body.razorpay_payment_id ?? "");
    const razorpaySignature = String(body.razorpay_signature ?? "");

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { ok: false, error: "FIELDS_MISSING", message: "Payment verification fields are missing." },
        { status: 400 }
      );
    }

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

    if (exportRow.razorpayOrderId !== razorpayOrderId) {
      return NextResponse.json(
        { ok: false, error: "ORDER_MISMATCH", message: "This payment doesn't match the requested download." },
        { status: 409 }
      );
    }

    const valid = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!valid) {
      return NextResponse.json(
        { ok: false, error: "SIGNATURE_INVALID", message: "Payment could not be verified." },
        { status: 400 }
      );
    }

    await markExportPaid({ exportId, razorpayPaymentId, razorpaySignature });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ResumeAuthError) {
      return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: error.status });
    }

    console.error("Resume export payment verification failed", error);
    return NextResponse.json(
      { ok: false, error: "VERIFY_FAILED", message: "Could not verify your payment. Please try again." },
      { status: 500 }
    );
  }
}
