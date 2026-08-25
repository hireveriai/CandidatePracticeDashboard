import { query } from "./pg";
import type { RequestOrigin } from "./request-origin";

export const FREE_PRACTICE_INTERVIEWS = 1;

export type PracticeEntitlementStatus =
  | "NOT_REQUESTED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type PracticeEntitlementState = {
  identityId: string | null;
  status: PracticeEntitlementStatus;
  requestId: string | null;
  requestedAt: string | null;
  decidedAt: string | null;
  granted: boolean;
  grantedAt: string | null;
  freeCreditsRemaining: number;
  freeCreditsUsed: number;
  /** Approved, granted, and the single free interview has already been used. */
  consumed: boolean;
  offer: { practiceInterviews: number };
};

export class PracticeEntitlementError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "PracticeEntitlementError";
    this.status = status;
    this.code = code;
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DB_ERROR_MAP: Record<string, { status: number; code: string; message: string }> = {
  TRIAL_REQUEST_RATE_LIMITED: {
    status: 429,
    code: "PRACTICE_REQUEST_RATE_LIMITED",
    message: "Too many requests from this network. Please try again later.",
  },
  TRIAL_REAPPLY_TOO_SOON: {
    status: 409,
    code: "PRACTICE_REAPPLY_TOO_SOON",
    message:
      "Your previous request was reviewed recently. Please contact support if you would like it reconsidered.",
  },
  IDENTITY_REQUIRED: {
    status: 401,
    code: "PRACTICE_SESSION_REQUIRED",
    message: "Please sign in to request your free practice interview.",
  },
};

function translateDatabaseError(error: unknown): never {
  const message = error instanceof Error ? error.message : "";

  for (const [key, mapped] of Object.entries(DB_ERROR_MAP)) {
    if (message.includes(key)) {
      throw new PracticeEntitlementError(mapped.status, mapped.code, mapped.message);
    }
  }

  console.error("Practice entitlement operation failed", error);
  throw new PracticeEntitlementError(
    503,
    "PRACTICE_REQUEST_FAILED",
    "Unable to process your request right now. Please try again."
  );
}

function toIsoOrNull(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toCount(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function emptyState(identityId: string | null): PracticeEntitlementState {
  return {
    identityId,
    status: "NOT_REQUESTED",
    requestId: null,
    requestedAt: null,
    decidedAt: null,
    granted: false,
    grantedAt: null,
    freeCreditsRemaining: 0,
    freeCreditsUsed: 0,
    consumed: false,
    offer: { practiceInterviews: FREE_PRACTICE_INTERVIEWS },
  };
}

export async function getPracticeEntitlementState(
  identityId?: string | null
): Promise<PracticeEntitlementState> {
  if (!identityId || !UUID_PATTERN.test(identityId)) {
    return emptyState(identityId ?? null);
  }

  try {
    const { rows } = await query<{ state: Record<string, unknown> }>(
      `select public.fn_get_candidate_practice_state($1::uuid) as state`,
      [identityId]
    );

    const state = rows[0]?.state ?? {};

    return {
      identityId,
      status: (String(state.status ?? "NOT_REQUESTED") as PracticeEntitlementStatus),
      requestId: state.requestId ? String(state.requestId) : null,
      requestedAt: toIsoOrNull(state.requestedAt),
      decidedAt: toIsoOrNull(state.decidedAt),
      granted: Boolean(state.granted),
      grantedAt: toIsoOrNull(state.grantedAt),
      freeCreditsRemaining: toCount(state.freeCreditsRemaining),
      freeCreditsUsed: toCount(state.freeCreditsUsed),
      consumed: Boolean(state.consumed),
      offer: { practiceInterviews: FREE_PRACTICE_INTERVIEWS },
    };
  } catch (error) {
    // Migration not applied on this environment yet.
    console.warn("Practice entitlement state read failed", error);
    return emptyState(identityId);
  }
}

async function getIdentityEmail(identityId: string) {
  const { rows } = await query<{ email: string | null; is_verified: boolean | null }>(
    `
      select lower(coalesce(primary_email, email)) as email, is_verified
      from public.identity_users
      where identity_id = $1::uuid
      limit 1
    `,
    [identityId]
  );

  return {
    email: rows[0]?.email ?? null,
    verified: Boolean(rows[0]?.is_verified),
  };
}

export async function requestFreePractice(input: {
  identityId: string;
  origin?: RequestOrigin;
}): Promise<PracticeEntitlementState> {
  if (!UUID_PATTERN.test(input.identityId)) {
    throw new PracticeEntitlementError(
      401,
      "PRACTICE_SESSION_REQUIRED",
      "Please sign in to request your free practice interview."
    );
  }

  const identity = await getIdentityEmail(input.identityId);

  try {
    // Eligibility checks, request creation and — when the checks pass cleanly —
    // the grant itself all happen inside this single database call, so double
    // clicks, retries and concurrent submits cannot produce two free credits.
    await query(
      `
        select *
        from public.fn_request_candidate_practice(
          $1::uuid,
          $2::text,
          $3::boolean,
          $4::text,
          $5::text,
          $6::text
        )
      `,
      [
        input.identityId,
        identity.email,
        identity.verified,
        input.origin?.ip ?? null,
        input.origin?.userAgent ?? null,
        input.origin?.deviceHash ?? null,
      ]
    );
  } catch (error) {
    translateDatabaseError(error);
  }

  return getPracticeEntitlementState(input.identityId);
}

/**
 * The server-side gate for starting a practice interview.
 *
 * A candidate may proceed on either a paid subscription credit or an approved
 * and unspent free-practice credit. Everything else is refused here, not in the
 * UI.
 */
export async function assertCanStartPracticeInterview(identityId: string) {
  const { rows } = await query<{ paid_credits: number; free_credits: number }>(
    `
      select
        coalesce((
          select sum(greatest(s."totalCredits", 0))
          from public.hireveri_user_subscriptions s
          join public.hireveri_plans p on p."id" = s."planId"
          where s."userId" = $1::text
            and p."planType" = 'PRACTICE_CANDIDATE'
            and s."id" <> 'free-practice-' || $1::text
            and coalesce(s."status", 'active') = 'active'
            and (s."expiresAt" is null or s."expiresAt" > now())
        ), 0)::int as paid_credits,
        coalesce((
          select greatest(s."totalCredits", 0)
          from public.hireveri_user_subscriptions s
          where s."id" = 'free-practice-' || $1::text
            and coalesce(s."status", 'active') = 'active'
        ), 0)::int as free_credits
    `,
    [identityId]
  );

  const paidCredits = toCount(rows[0]?.paid_credits);
  const freeCredits = toCount(rows[0]?.free_credits);

  if (paidCredits > 0 || freeCredits > 0) {
    return { paidCredits, freeCredits };
  }

  const state = await getPracticeEntitlementState(identityId);

  if (state.status === "PENDING_REVIEW") {
    throw new PracticeEntitlementError(
      403,
      "PRACTICE_REQUEST_PENDING",
      "Your free practice request is still under review. We usually review within 24 hours."
    );
  }

  if (state.consumed) {
    throw new PracticeEntitlementError(
      402,
      "PRACTICE_FREE_CREDIT_USED",
      "You've used your free practice interview. Choose a practice plan to continue."
    );
  }

  throw new PracticeEntitlementError(
    402,
    "PRACTICE_ENTITLEMENT_REQUIRED",
    "Request your free practice interview or choose a practice plan to get started."
  );
}
