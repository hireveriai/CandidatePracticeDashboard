import { getSessionIdentityId } from "@/lib/server/session";
import { getPracticeCandidateId } from "./resume-store";

export class ResumeAuthError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ResumeAuthError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Every resume-feature route calls this first. It is the single place that
 * enforces "a candidate may only ever act on their own resumes/interviews" --
 * everything downstream is scoped by the returned candidateId.
 */
export async function requireCandidateId() {
  const identityId = await getSessionIdentityId();
  if (!identityId) {
    throw new ResumeAuthError(401, "SESSION_REQUIRED", "Please sign in to continue.");
  }

  const candidateId = await getPracticeCandidateId(identityId);
  if (!candidateId) {
    throw new ResumeAuthError(404, "CANDIDATE_NOT_FOUND", "Start a practice interview or upload a resume first.");
  }

  return { identityId, candidateId };
}

/** Like requireCandidateId, but returns null instead of throwing when the
 * candidate has no resume/interview history yet -- for read-only routes that
 * should render an empty state rather than an error for a brand-new account. */
export async function getOptionalCandidateId() {
  const identityId = await getSessionIdentityId();
  if (!identityId) return null;
  return getPracticeCandidateId(identityId);
}
