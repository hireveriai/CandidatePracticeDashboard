const DEFAULT_EMAIL_FROM = "VerisNova <no-reply@mail.verisnova.com>";
const RESEND_API_URL = "https://api.resend.com/emails";

type PracticeNotification = {
  to: string;
  status: "PENDING_REVIEW" | "APPROVED";
  requestId?: string | null;
};

export type PracticeReviewRequestDetails = {
  candidateEmail: string | null;
  requestId?: string | null;
  status: string;
  fullName?: string;
  phone?: string;
  currentRole?: string;
  message?: string;
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

function getAdminNotificationEmail() {
  return (
    process.env.PRACTICE_REVIEW_ADMIN_EMAIL?.trim() ||
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
    process.env.SMTP_USER?.trim() ||
    null
  );
}

/**
 * Notifies the reviewer inbox whenever a candidate submits a free-practice
 * request, so approval happens off the SMTP creds already configured for
 * this app rather than depending on Resend being set up. Never throws —
 * a notification failure must not block the candidate's request.
 */
export async function sendPracticeReviewRequestEmail(details: PracticeReviewRequestDetails) {
  const adminEmail = getAdminNotificationEmail();
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();

  if (!adminEmail || !smtpHost || !smtpUser || !smtpPass) {
    console.warn("Practice review notification skipped: SMTP is not fully configured");
    return false;
  }

  const rows: Array<[string, string]> = [
    ["Candidate email", details.candidateEmail ?? "Unknown"],
    ["Full name", details.fullName || "Not provided"],
    ["Phone", details.phone || "Not provided"],
    ["Current role", details.currentRole || "Not provided"],
    ["Status", details.status],
    ...(details.requestId ? ([["Request ID", details.requestId]] as Array<[string, string]>) : []),
  ];

  const subject = `New free practice interview request${details.fullName ? ` — ${details.fullName}` : ""}`;

  try {
    const { default: nodemailer } = await import("nodemailer");

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM?.trim() || getEmailFrom(),
      to: adminEmail,
      subject,
      text: [
        ...rows.map(([label, value]) => `${label}: ${value}`),
        "",
        details.message ? `Message:\n${details.message}` : "No additional message.",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:560px">
          <h2 style="margin:0 0 16px;font-size:20px">${escapeHtml(subject)}</h2>
          <table style="border-collapse:collapse;font-size:14px;width:100%">
            ${rows
              .map(
                ([label, value]) => `
                  <tr>
                    <td style="padding:6px 12px 6px 0;color:#64748b;white-space:nowrap">${escapeHtml(label)}</td>
                    <td style="padding:6px 0;color:#0f172a">${escapeHtml(value)}</td>
                  </tr>
                `
              )
              .join("")}
          </table>
          ${
            details.message
              ? `<p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:#334155;white-space:pre-wrap">${escapeHtml(details.message)}</p>`
              : ""
          }
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.warn("Practice review notification email failed", error);
    return false;
  }
}
