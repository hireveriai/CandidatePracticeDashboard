import { query } from "@/lib/server/pg";

export type EligibleInterview = {
  attemptId: string;
  interviewId: string;
  jobTitle: string | null;
  interviewDate: string | null;
  durationSeconds: number | null;
  overallScore: number | null;
  status: string;
  hasTranscript: boolean;
  hasReport: boolean;
};

/**
 * Interviews this candidate can use for "Enhance Using Interview Insights".
 * Only the most recent completed attempt per interview is offered, and only
 * when there is enough usable transcript + report data to work with -- this
 * never reads from or writes to any Calm Room engine table besides the
 * read-only result/evaluation tables it already produces.
 */
export async function getEligibleInterviewsForCandidate(candidateId: string): Promise<EligibleInterview[]> {
  const { rows } = await query<{
    attempt_id: string;
    interview_id: string;
    job_title: string | null;
    interview_date: string | null;
    time_elapsed_seconds: number | null;
    status: string;
    overall_score: number | null;
    final_score: string | null;
    answer_count: string;
    has_recording_transcript: boolean;
    has_summary: boolean;
    has_evaluation: boolean;
  }>(
    `
      select
        a.attempt_id::text,
        i.interview_id::text,
        jp.job_title,
        a.started_at::text as interview_date,
        a.time_elapsed_seconds,
        a.status,
        s.overall_score,
        ev.final_score::text as final_score,
        (
          select count(*)::text
          from public.interview_answers ans
          where ans.attempt_id = a.attempt_id
            and coalesce(ans.answer_text, '') <> ''
        ) as answer_count,
        exists(
          select 1 from public.interview_recordings r
          where r.attempt_id = a.attempt_id and coalesce(r.transcript, '') <> ''
        ) as has_recording_transcript,
        (s.attempt_id is not null) as has_summary,
        (ev.attempt_id is not null) as has_evaluation
      from public.interview_attempts a
      join public.interviews i on i.interview_id = a.interview_id
      join public.job_positions jp on jp.job_id = i.job_id
      left join public.interview_summaries s on s.attempt_id = a.attempt_id
      left join public.interview_evaluations ev on ev.attempt_id = a.attempt_id
      where i.candidate_id = $1::uuid
        and a.status = 'COMPLETED'
        and a.attempt_id = (
          select a2.attempt_id
          from public.interview_attempts a2
          where a2.interview_id = a.interview_id and a2.status = 'COMPLETED'
          order by a2.started_at desc
          limit 1
        )
      order by a.started_at desc
    `,
    [candidateId]
  );

  return rows.map((row) => {
    const answerCount = Number(row.answer_count ?? 0);
    const hasTranscript = answerCount > 0 || row.has_recording_transcript;
    const hasReport = row.has_summary || row.has_evaluation;
    const overallScore =
      row.overall_score !== null
        ? row.overall_score
        : row.final_score !== null
          ? Math.round(Number(row.final_score))
          : null;

    return {
      attemptId: row.attempt_id,
      interviewId: row.interview_id,
      jobTitle: row.job_title,
      interviewDate: row.interview_date,
      durationSeconds: row.time_elapsed_seconds,
      overallScore,
      status: row.status,
      hasTranscript,
      hasReport,
    };
  });
}

export type InterviewTranscriptAndReport = {
  transcriptExcerpt: string;
  report: {
    role: string | null;
    strengths: string | null;
    weaknesses: string | null;
    overallScore: number | null;
  };
};

const MAX_TRANSCRIPT_CHARS = 12_000;

export async function getInterviewTranscriptAndReport(
  attemptId: string,
  candidateId: string
): Promise<InterviewTranscriptAndReport | null> {
  const { rows: ownershipRows } = await query<{ job_title: string | null }>(
    `
      select jp.job_title
      from public.interview_attempts a
      join public.interviews i on i.interview_id = a.interview_id
      join public.job_positions jp on jp.job_id = i.job_id
      where a.attempt_id = $1::uuid and i.candidate_id = $2::uuid
      limit 1
    `,
    [attemptId, candidateId]
  );

  const owned = ownershipRows[0];
  if (!owned) {
    return null;
  }

  const { rows: answerRows } = await query<{
    answer_text: string | null;
    question_text: string | null;
    question_order: number | null;
  }>(
    `
      select
        ans.answer_text,
        iq.question_text,
        iq.question_order
      from public.interview_answers ans
      join public.interview_attempts a on a.attempt_id = ans.attempt_id
      left join public.interview_questions iq
        on iq.interview_id = a.interview_id
        and (iq.interview_question_id = ans.question_id or iq.question_id = ans.question_id)
      where ans.attempt_id = $1::uuid
      order by coalesce(iq.question_order, 999), ans.answered_at
    `,
    [attemptId]
  );

  let transcriptExcerpt = answerRows
    .filter((row) => row.answer_text && row.answer_text.trim())
    .map(
      (row, index) =>
        `Q${row.question_order ?? index + 1}: ${row.question_text ?? "Question"}\nCandidate: ${row.answer_text}`
    )
    .join("\n\n");

  if (!transcriptExcerpt.trim()) {
    const { rows: recordingRows } = await query<{ transcript: string | null }>(
      `
        select transcript
        from public.interview_recordings
        where attempt_id = $1::uuid and coalesce(transcript, '') <> ''
        order by char_length(transcript) desc
        limit 1
      `,
      [attemptId]
    );
    transcriptExcerpt = recordingRows[0]?.transcript ?? "";
  }

  transcriptExcerpt = transcriptExcerpt.slice(0, MAX_TRANSCRIPT_CHARS);

  if (!transcriptExcerpt.trim()) {
    return null;
  }

  const { rows: reportRows } = await query<{
    strengths: string | null;
    weaknesses: string | null;
    overall_score: number | null;
    final_score: string | null;
  }>(
    `
      select s.strengths, s.weaknesses, s.overall_score, ev.final_score::text as final_score
      from public.interview_attempts a
      left join public.interview_summaries s on s.attempt_id = a.attempt_id
      left join public.interview_evaluations ev on ev.attempt_id = a.attempt_id
      where a.attempt_id = $1::uuid
      limit 1
    `,
    [attemptId]
  );

  const report = reportRows[0];

  return {
    transcriptExcerpt,
    report: {
      role: owned.job_title,
      strengths: report?.strengths ?? null,
      weaknesses: report?.weaknesses ?? null,
      overallScore: report?.overall_score ?? (report?.final_score ? Math.round(Number(report.final_score)) : null),
    },
  };
}
