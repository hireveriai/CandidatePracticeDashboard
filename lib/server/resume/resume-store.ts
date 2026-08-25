import { query } from "@/lib/server/pg";
import { EMPTY_STRUCTURED_RESUME, type ResumeEnhancementSuggestion, type StructuredResume } from "./types";

export class ResumeStoreError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ResumeStoreError";
    this.status = status;
    this.code = code;
  }
}

export async function getPracticeCandidateId(identityId: string) {
  const { rows } = await query<{ candidate_id: string }>(
    `
      select c.candidate_id::text
      from public.candidate_identity_links cil
      join public.candidates c on c.candidate_id = cil.candidate_id
      where cil.identity_id = $1::uuid and cil.purpose = 'practice'
      order by c.created_at desc
      limit 1
    `,
    [identityId]
  );

  return rows[0]?.candidate_id ?? null;
}

export type CandidateResumeRow = {
  resumeId: string;
  candidateId: string;
  enhancementType: "original" | "ai_enhancement" | "interview_enhancement";
  parentResumeId: string | null;
  filePath: string | null;
  fileType: string | null;
  structuredData: StructuredResume;
  isCurrent: boolean;
  createdAt: string;
};

type CandidateResumeQueryRow = {
  resume_id: string;
  candidate_id: string;
  enhancement_type: string;
  parent_resume_id: string | null;
  file_path: string | null;
  file_type: string | null;
  structured_data: unknown;
  is_current: boolean;
  created_at: string;
};

function mapResumeRow(row: CandidateResumeQueryRow): CandidateResumeRow {
  return {
    resumeId: row.resume_id,
    candidateId: row.candidate_id,
    enhancementType: row.enhancement_type as CandidateResumeRow["enhancementType"],
    parentResumeId: row.parent_resume_id,
    filePath: row.file_path,
    fileType: row.file_type,
    structuredData: (row.structured_data as StructuredResume) ?? EMPTY_STRUCTURED_RESUME,
    isCurrent: row.is_current,
    createdAt: row.created_at,
  };
}

export async function listCandidateResumes(candidateId: string) {
  const { rows } = await query<CandidateResumeQueryRow>(
    `
      select resume_id::text, candidate_id::text, enhancement_type, parent_resume_id::text,
             file_path, file_type, structured_data, is_current, created_at::text
      from public.candidate_resumes
      where candidate_id = $1::uuid
      order by created_at desc
    `,
    [candidateId]
  );

  return rows.map(mapResumeRow);
}

export async function getCandidateResume(resumeId: string, candidateId: string) {
  const { rows } = await query<CandidateResumeQueryRow>(
    `
      select resume_id::text, candidate_id::text, enhancement_type, parent_resume_id::text,
             file_path, file_type, structured_data, is_current, created_at::text
      from public.candidate_resumes
      where resume_id = $1::uuid and candidate_id = $2::uuid
      limit 1
    `,
    [resumeId, candidateId]
  );

  const row = rows[0];
  return row ? mapResumeRow(row) : null;
}

export async function createOriginalResume(input: {
  candidateId: string;
  filePath: string;
  fileType: string;
  rawText: string;
  structuredData: StructuredResume;
}) {
  await query(`update public.candidate_resumes set is_current = false where candidate_id = $1::uuid`, [
    input.candidateId,
  ]);

  const { rows } = await query<{ resume_id: string }>(
    `
      insert into public.candidate_resumes
        (candidate_id, enhancement_type, file_path, file_type, raw_text, structured_data, is_current)
      values ($1::uuid, 'original', $2, $3, $4, $5::jsonb, true)
      returning resume_id::text
    `,
    [input.candidateId, input.filePath, input.fileType, input.rawText, JSON.stringify(input.structuredData)]
  );

  return rows[0].resume_id;
}

export async function createDerivedResume(input: {
  candidateId: string;
  parentResumeId: string;
  enhancementType: "ai_enhancement" | "interview_enhancement";
  structuredData: StructuredResume;
}) {
  const { rows } = await query<{ resume_id: string }>(
    `
      insert into public.candidate_resumes
        (candidate_id, enhancement_type, parent_resume_id, structured_data, is_current)
      values ($1::uuid, $2, $3::uuid, $4::jsonb, false)
      returning resume_id::text
    `,
    [input.candidateId, input.enhancementType, input.parentResumeId, JSON.stringify(input.structuredData)]
  );

  return rows[0].resume_id;
}

export async function setCurrentResume(resumeId: string, candidateId: string) {
  await query(`update public.candidate_resumes set is_current = false where candidate_id = $1::uuid`, [candidateId]);
  await query(
    `update public.candidate_resumes set is_current = true where resume_id = $1::uuid and candidate_id = $2::uuid`,
    [resumeId, candidateId]
  );
}

export type EnhancementSessionRow = {
  sessionId: string;
  candidateId: string;
  sourceResumeId: string;
  enhancementType: "ai_enhancement" | "interview_enhancement";
  interviewAttemptId: string | null;
  status: "processing" | "ready_for_review" | "approved" | "failed";
  errorMessage: string | null;
  createdAt: string;
};

type EnhancementSessionQueryRow = {
  session_id: string;
  candidate_id: string;
  source_resume_id: string;
  enhancement_type: string;
  interview_attempt_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
};

function mapSessionRow(row: EnhancementSessionQueryRow): EnhancementSessionRow {
  return {
    sessionId: row.session_id,
    candidateId: row.candidate_id,
    sourceResumeId: row.source_resume_id,
    enhancementType: row.enhancement_type as EnhancementSessionRow["enhancementType"],
    interviewAttemptId: row.interview_attempt_id,
    status: row.status as EnhancementSessionRow["status"],
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

export async function findReusableSession(input: {
  candidateId: string;
  sourceResumeId: string;
  enhancementType: "ai_enhancement" | "interview_enhancement";
  interviewAttemptId: string | null;
}) {
  const { rows } = await query<EnhancementSessionQueryRow>(
    `
      select session_id::text, candidate_id::text, source_resume_id::text, enhancement_type,
             interview_attempt_id::text, status, error_message, created_at::text
      from public.resume_enhancement_sessions
      where candidate_id = $1::uuid
        and source_resume_id = $2::uuid
        and enhancement_type = $3
        and interview_attempt_id is not distinct from $4::uuid
        and status in ('ready_for_review', 'approved')
      order by created_at desc
      limit 1
    `,
    [input.candidateId, input.sourceResumeId, input.enhancementType, input.interviewAttemptId]
  );

  const row = rows[0];
  return row ? mapSessionRow(row) : null;
}

export async function createEnhancementSession(input: {
  candidateId: string;
  sourceResumeId: string;
  enhancementType: "ai_enhancement" | "interview_enhancement";
  interviewAttemptId: string | null;
}) {
  const { rows } = await query<{ session_id: string }>(
    `
      insert into public.resume_enhancement_sessions
        (candidate_id, source_resume_id, enhancement_type, interview_attempt_id, status)
      values ($1::uuid, $2::uuid, $3, $4::uuid, 'processing')
      returning session_id::text
    `,
    [input.candidateId, input.sourceResumeId, input.enhancementType, input.interviewAttemptId]
  );

  return rows[0].session_id;
}

export async function markSessionFailed(sessionId: string, errorMessage: string) {
  await query(
    `update public.resume_enhancement_sessions set status = 'failed', error_message = $2, updated_at = now() where session_id = $1::uuid`,
    [sessionId, errorMessage.slice(0, 500)]
  );
}

export async function markSessionReady(
  sessionId: string,
  usage: { model: string | null; inputTokens: number | null; outputTokens: number | null }
) {
  await query(
    `
      update public.resume_enhancement_sessions
      set status = 'ready_for_review', ai_model = $2, ai_input_tokens = $3, ai_output_tokens = $4, updated_at = now()
      where session_id = $1::uuid
    `,
    [sessionId, usage.model, usage.inputTokens, usage.outputTokens]
  );
}

export async function markSessionApproved(sessionId: string) {
  await query(
    `update public.resume_enhancement_sessions set status = 'approved', updated_at = now() where session_id = $1::uuid`,
    [sessionId]
  );
}

export async function getSession(sessionId: string, candidateId: string) {
  const { rows } = await query<EnhancementSessionQueryRow>(
    `
      select session_id::text, candidate_id::text, source_resume_id::text, enhancement_type,
             interview_attempt_id::text, status, error_message, created_at::text
      from public.resume_enhancement_sessions
      where session_id = $1::uuid and candidate_id = $2::uuid
      limit 1
    `,
    [sessionId, candidateId]
  );

  const row = rows[0];
  return row ? mapSessionRow(row) : null;
}

export type SuggestionRow = ResumeEnhancementSuggestion & {
  suggestionId: string;
  sessionId: string;
  decision: "pending" | "accepted" | "rejected";
};

export async function saveSuggestions(sessionId: string, suggestions: ResumeEnhancementSuggestion[]) {
  for (const suggestion of suggestions) {
    await query(
      `
        insert into public.resume_enhancement_suggestions
          (session_id, field_path, suggestion_type, current_text, suggested_text, source, evidence, confidence, requires_confirmation)
        values ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        sessionId,
        suggestion.fieldPath,
        suggestion.suggestionType,
        suggestion.currentText,
        suggestion.suggestedText,
        suggestion.source,
        suggestion.evidence,
        suggestion.confidence,
        suggestion.requiresConfirmation,
      ]
    );
  }
}

export async function listSuggestions(sessionId: string): Promise<SuggestionRow[]> {
  const { rows } = await query<{
    suggestion_id: string;
    session_id: string;
    field_path: string;
    suggestion_type: string;
    current_text: string | null;
    suggested_text: string;
    source: string;
    evidence: string | null;
    confidence: string | null;
    requires_confirmation: boolean;
    decision: string;
  }>(
    `
      select suggestion_id::text, session_id::text, field_path, suggestion_type, current_text, suggested_text,
             source, evidence, confidence::text, requires_confirmation, decision
      from public.resume_enhancement_suggestions
      where session_id = $1::uuid
      order by created_at
    `,
    [sessionId]
  );

  return rows.map((row) => ({
    suggestionId: row.suggestion_id,
    sessionId: row.session_id,
    fieldPath: row.field_path,
    suggestionType: row.suggestion_type as ResumeEnhancementSuggestion["suggestionType"],
    currentText: row.current_text,
    suggestedText: row.suggested_text,
    source: row.source as ResumeEnhancementSuggestion["source"],
    evidence: row.evidence ?? "",
    confidence: row.confidence ? Number(row.confidence) : 0,
    requiresConfirmation: row.requires_confirmation,
    decision: row.decision as SuggestionRow["decision"],
  }));
}

export async function setSuggestionDecision(input: {
  suggestionId: string;
  sessionId: string;
  decision: "accepted" | "rejected";
}) {
  await query(
    `
      update public.resume_enhancement_suggestions
      set decision = $3, decided_at = now()
      where suggestion_id = $1::uuid and session_id = $2::uuid
    `,
    [input.suggestionId, input.sessionId, input.decision]
  );
}

export async function setAllSuggestionDecisions(sessionId: string, decision: "accepted" | "rejected") {
  await query(
    `update public.resume_enhancement_suggestions set decision = $2, decided_at = now() where session_id = $1::uuid`,
    [sessionId, decision]
  );
}

export async function createExport(input: {
  sessionId: string;
  candidateResumeId: string;
  priceAmountMinor: number;
  currency: string;
  templateId: string;
  pricingTier: "standard" | "premium";
}) {
  const { rows } = await query<{ export_id: string }>(
    `
      insert into public.resume_exports (session_id, candidate_resume_id, price_amount_minor, currency, template_id, pricing_tier)
      values ($1::uuid, $2::uuid, $3, $4, $5, $6)
      returning export_id::text
    `,
    [input.sessionId, input.candidateResumeId, input.priceAmountMinor, input.currency, input.templateId, input.pricingTier]
  );

  return rows[0].export_id;
}

/** Avoids re-rendering + re-uploading files for a resume/template combo the
 * candidate already generated -- reused whenever they revisit the same
 * choice instead of calling the renderer (and, upstream, OpenAI) again. */
export async function findExportByResumeAndTemplate(candidateResumeId: string, templateId: string) {
  const { rows } = await query<{ export_id: string }>(
    `
      select export_id::text
      from public.resume_exports
      where candidate_resume_id = $1::uuid and template_id = $2
      order by created_at desc
      limit 1
    `,
    [candidateResumeId, templateId]
  );

  return rows[0]?.export_id ?? null;
}

export async function setExportFiles(exportId: string, pdfPath: string, docxPath: string) {
  await query(`update public.resume_exports set pdf_path = $2, docx_path = $3 where export_id = $1::uuid`, [
    exportId,
    pdfPath,
    docxPath,
  ]);
}

export type ExportRow = {
  exportId: string;
  sessionId: string;
  candidateResumeId: string;
  pdfPath: string | null;
  docxPath: string | null;
  isPaid: boolean;
  priceAmountMinor: number;
  currency: string;
  razorpayOrderId: string | null;
  templateId: string | null;
  pricingTier: "standard" | "premium";
};

export async function getExportForCandidate(exportId: string, candidateId: string): Promise<ExportRow | null> {
  const { rows } = await query<{
    export_id: string;
    session_id: string;
    candidate_resume_id: string;
    pdf_path: string | null;
    docx_path: string | null;
    is_paid: boolean;
    price_amount_minor: number;
    currency: string;
    razorpay_order_id: string | null;
    template_id: string | null;
    pricing_tier: string;
  }>(
    `
      select e.export_id::text, e.session_id::text, e.candidate_resume_id::text, e.pdf_path, e.docx_path,
             e.is_paid, e.price_amount_minor, e.currency, e.razorpay_order_id, e.template_id, e.pricing_tier
      from public.resume_exports e
      join public.resume_enhancement_sessions s on s.session_id = e.session_id
      where e.export_id = $1::uuid and s.candidate_id = $2::uuid
      limit 1
    `,
    [exportId, candidateId]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    exportId: row.export_id,
    sessionId: row.session_id,
    candidateResumeId: row.candidate_resume_id,
    pdfPath: row.pdf_path,
    docxPath: row.docx_path,
    isPaid: row.is_paid,
    priceAmountMinor: row.price_amount_minor,
    currency: row.currency,
    razorpayOrderId: row.razorpay_order_id,
    templateId: row.template_id,
    pricingTier: row.pricing_tier as "standard" | "premium",
  };
}

export async function setExportOrder(exportId: string, razorpayOrderId: string) {
  await query(`update public.resume_exports set razorpay_order_id = $2 where export_id = $1::uuid`, [
    exportId,
    razorpayOrderId,
  ]);
}

export async function markExportPaid(input: {
  exportId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  await query(
    `
      update public.resume_exports
      set is_paid = true, razorpay_payment_id = $2, razorpay_signature = $3, paid_at = now()
      where export_id = $1::uuid
    `,
    [input.exportId, input.razorpayPaymentId, input.razorpaySignature]
  );
}
