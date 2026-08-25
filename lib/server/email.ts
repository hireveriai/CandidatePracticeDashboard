const DEFAULT_EMAIL_FROM = "VerisNova <no-reply@mail.verisnova.com>";
const RESEND_API_URL = "https://api.resend.com/emails";

type PracticeNotification = {
  to: string;
  status: "PENDING_REVIEW" | "APPROVED";
  requestId?: string | null;
};

function getEmailFrom() {
  return (
    process.env.EMAIL_FROM?.trim() ||
    (process.env.RESEND_FROM_EMAIL?.trim()
      ? `${process.env.RESEND_FROM_NAME?.trim() || "VerisNova"} <${process.env.RESEND_FROM_EMAIL.trim()}>`
      : DEFAULT_EMAIL_FROM)
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Sends through the same Resend account the rest of the product uses, via the
 * REST API so the candidate app does not need to take on a new dependency.
 * Returns false (never throws) when email is not configured — notifications
 * must never block an entitlement request.
 */
export async function sendFreePracticeEmail(params: PracticeNotification) {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey || !params.to || params.to.endsWith("@verisnova.local")) {
    return false;
  }

  const approved = params.status === "APPROVED";
  const subject = approved
    ? "Your free practice interview is ready"
    : "Free practice request received";
  const body = approved
    ? "Your account now has 1 free VERIS AI practice interview. You can start it any time from your dashboard."
    : "We received your request for a free VERIS AI practice interview. Requests are usually reviewed within 24 hours, and we'll email you as soon as it's ready.";

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(params.requestId ? { "Idempotency-Key": `practice-${params.status}-${params.requestId}` } : {}),
      },
      body: JSON.stringify({
        from: getEmailFrom(),
        to: params.to,
        subject,
        text: `Hi,\n\n${body}\n\n— VerisNova`,
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:560px">
            <h2 style="margin:0 0 16px;font-size:20px">${escapeHtml(subject)}</h2>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155">${escapeHtml(body)}</p>
            ${
              params.requestId
                ? `<p style="margin:0;font-size:12px;color:#64748b">Reference: ${escapeHtml(params.requestId)}</p>`
                : ""
            }
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.warn("Practice notification email rejected", response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Practice notification email failed", error);
    return false;
  }
}
