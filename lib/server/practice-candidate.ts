import { query } from "./pg";

export type PracticeInterviewInput = {
  identityId: string;
  email?: string;
  fullName?: string;
  role: string;
  experience: string;
  difficulty: string;
  interviewType: string;
  language: string;
  duration: string;
  coding: boolean;
};

type SchemaSupport = {
  candidates: boolean;
  organizations: boolean;
  job_positions: boolean;
  interviews: boolean;
  interview_invites: boolean;
  interview_configs: boolean;
  evaluation_template_pool: boolean;
  identity_users: boolean;
  candidate_identity_links: boolean;
  sp_create_practice_candidate: boolean;
  fn_create_job: boolean;
  fn_create_interview_link: boolean;
  fn_validate_interview_token: boolean;
};

const EMPTY_SCHEMA_SUPPORT: SchemaSupport = {
  candidates: false,
  organizations: false,
  job_positions: false,
  interviews: false,
  interview_invites: false,
  interview_configs: false,
  evaluation_template_pool: false,
  identity_users: false,
  candidate_identity_links: false,
  sp_create_practice_candidate: false,
  fn_create_job: false,
  fn_create_interview_link: false,
  fn_validate_interview_token: false,
};

type PracticeCandidateRow = {
  user_id: string;
  organization_id: string;
  created_new: boolean;
};

type JobRow = {
  job_id: string;
};

type InterviewLinkRow = {
  interview_id: string;
  token: string;
  link: string;
};

export type PracticeDashboardInterview = {
  interviewId: string;
  jobId: string | null;
  jobTitle: string | null;
  status: string | null;
  interviewType: string | null;
  createdAt: string | null;
  durationMinutes: number | null;
  token: string | null;
  expiresAt: string | null;
};

export type PracticeDashboardData = {
  schema: SchemaSupport;
  candidate: {
    candidateId: string;
    fullName: string | null;
    email: string | null;
    createdAt: string | null;
    organizationId: string | null;
    organizationName: string | null;
  } | null;
  interviews: PracticeDashboardInterview[];
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizePracticeIdentity(identityId: string) {
  if (!UUID_PATTERN.test(identityId)) {
    throw new Error("INVALID_IDENTITY_ID");
  }

  return identityId;
}

export function getPracticeEmail(identityId: string, email?: string) {
  const normalized = email?.trim().toLowerCase();
  if (normalized) {
    return normalized;
  }

  return `practice+${identityId.replaceAll("-", "")}@hireveri.local`;
}

export async function getSchemaSupport(): Promise<SchemaSupport> {
  const { rows } = await query<SchemaSupport>(`
    select
      to_regclass('public.candidates') is not null as candidates,
      to_regclass('public.organizations') is not null as organizations,
      to_regclass('public.job_positions') is not null as job_positions,
      to_regclass('public.interviews') is not null as interviews,
      to_regclass('public.interview_invites') is not null as interview_invites,
      to_regclass('public.interview_configs') is not null as interview_configs,
      to_regclass('public.evaluation_template_pool') is not null as evaluation_template_pool,
      to_regclass('public.identity_users') is not null as identity_users,
      to_regclass('public.candidate_identity_links') is not null as candidate_identity_links,
      exists(select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'sp_create_practice_candidate') as sp_create_practice_candidate,
      exists(select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'fn_create_job') as fn_create_job,
      exists(select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'fn_create_interview_link') as fn_create_interview_link,
      exists(select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'fn_validate_interview_token') as fn_validate_interview_token
  `);

  return rows[0];
}

export async function ensurePracticeCandidate(input: {
  identityId: string;
  email?: string;
  fullName?: string;
}) {
  const support = await getSchemaSupport();
  const identityId = normalizePracticeIdentity(input.identityId);
  const email = getPracticeEmail(identityId, input.email);
  const fullName = input.fullName?.trim() || "Practice Candidate";

  if (support.sp_create_practice_candidate) {
    const { rows } = await query<PracticeCandidateRow>(
      `
        select user_id::text, organization_id::text, created_new
        from public.sp_create_practice_candidate($1::uuid, $2::text, $3::text)
        limit 1
      `,
      [identityId, email, fullName]
    );

    const row = rows[0];
    if (!row?.user_id || !row.organization_id) {
      throw new Error("PRACTICE_CANDIDATE_CREATE_FAILED");
    }

    return {
      candidateId: row.user_id,
      organizationId: row.organization_id,
      createdNew: row.created_new,
      email,
    };
  }

  if (!support.candidates || !support.organizations) {
    throw new Error("PRACTICE_CANDIDATE_SCHEMA_MISSING");
  }

  const org = await query<{ organization_id: string }>(
    `
      with existing as (
        select organization_id
        from public.organizations
        where lower(organization_name) in ('practice arena', 'practice')
        order by case when lower(organization_name) = 'practice arena' then 0 else 1 end
        limit 1
      ),
      inserted as (
        insert into public.organizations (organization_name, is_active)
        select 'Practice Arena', true
        where not exists (select 1 from existing)
        returning organization_id
      )
      select organization_id::text from existing
      union all
      select organization_id::text from inserted
      limit 1
    `
  );

  const organizationId = org.rows[0]?.organization_id;
  if (!organizationId) {
    throw new Error("PRACTICE_ORGANIZATION_CREATE_FAILED");
  }

  const candidate = await query<{ candidate_id: string; created_new: boolean }>(
    `
      with existing as (
        select candidate_id
        from public.candidates
        where organization_id = $1::uuid
          and lower(email) = lower($2)
        order by created_at desc
        limit 1
      ),
      inserted as (
        insert into public.candidates (organization_id, full_name, email, status)
        select $1::uuid, $3, lower($2), 'INVITED'
        where not exists (select 1 from existing)
        returning candidate_id
      ),
      resolved as (
        select candidate_id, false as created_new from existing
        union all
        select candidate_id, true as created_new from inserted
        limit 1
      )
      update public.candidates c
      set full_name = $3
      from resolved r
      where c.candidate_id = r.candidate_id
      returning c.candidate_id::text, r.created_new
    `,
    [organizationId, email, fullName]
  );

  const candidateId = candidate.rows[0]?.candidate_id;
  if (!candidateId) {
    throw new Error("PRACTICE_CANDIDATE_CREATE_FAILED");
  }

  if (support.identity_users) {
    await query(
      `
        insert into public.identity_users (identity_id, email, primary_email, intent, is_verified)
        values ($1::uuid, lower($2), lower($2), 'candidate_practice', true)
        on conflict (identity_id) do update
        set email = excluded.email,
            primary_email = excluded.primary_email,
            intent = 'candidate_practice',
            is_verified = true
      `,
      [identityId, email]
    );
  }

  if (support.candidate_identity_links) {
    await query(
      `
        insert into public.candidate_identity_links (identity_id, candidate_id, purpose)
        values ($1::uuid, $2::uuid, 'practice')
        on conflict (identity_id, candidate_id) do nothing
      `,
      [identityId, candidateId]
    );
  }

  return {
    candidateId,
    organizationId,
    createdNew: candidate.rows[0].created_new,
    email,
  };
}

async function getExperienceLevelId(experience: string) {
  const normalized = experience.toLowerCase();
  const preferred =
    normalized.includes("entry") ? ["entry", "junior", "fresher"] :
    normalized.includes("senior") || normalized.includes("leadership") ? ["senior", "lead"] :
    ["mid", "intermediate"];

  const { rows } = await query<{ experience_level_id: number }>(
    `
      select experience_level_id
      from public.experience_level_pool
      where lower(label) = any($1::text[])
      order by experience_level_id
      limit 1
    `,
    [preferred]
  );

  return rows[0]?.experience_level_id ?? 2;
}

function toDifficultyProfile(difficulty: string) {
  const normalized = difficulty.toLowerCase();
  if (normalized.includes("warm")) return "JUNIOR";
  if (normalized.includes("challeng")) return "SENIOR";
  return "MID";
}

function toDurationMinutes(duration: string) {
  const value = Number(duration.match(/\d+/)?.[0] ?? 30);
  if (value <= 30) return 30;
  if (value <= 45) return 45;
  return 60;
}

function getCoreSkills(role: string, interviewType: string) {
  const base = ["communication", "structured answers", "role alignment"];
  const roleLower = role.toLowerCase();

  if (roleLower.includes("frontend")) return [...base, "react", "javascript", "problem solving"];
  if (roleLower.includes("data")) return [...base, "sql", "analytics", "insight storytelling"];
  if (roleLower.includes("success")) return [...base, "customer empathy", "stakeholder management"];
  if (interviewType.toLowerCase().includes("technical")) return [...base, "technical depth"];
  return [...base, "product thinking", "prioritization"];
}

async function ensurePracticeJob(input: PracticeInterviewInput, organizationId: string) {
  const support = await getSchemaSupport();
  if (!support.job_positions) {
    throw new Error("JOB_SCHEMA_MISSING");
  }

  const duration = toDurationMinutes(input.duration);
  const difficultyProfile = toDifficultyProfile(input.difficulty);
  const codingRequired = input.coding ? "YES" : "NO";
  const coreSkills = getCoreSkills(input.role, input.interviewType);
  const jobTitle = `Practice - ${input.role}`;
  const jobDescription = [
    `${input.interviewType} practice interview in ${input.language}.`,
    `Difficulty: ${input.difficulty}.`,
    `Experience: ${input.experience}.`,
  ].join(" ");
  const experienceLevelId = await getExperienceLevelId(input.experience);

  const existing = await query<JobRow>(
    `
      select job_id::text
      from public.job_positions
      where organization_id = $1::uuid
        and job_title = $2
        and interview_duration_minutes = $3
      order by job_id desc
      limit 1
    `,
    [organizationId, jobTitle, duration]
  );

  if (existing.rows[0]?.job_id) {
    return existing.rows[0].job_id;
  }

  if (support.fn_create_job) {
    const created = await query<JobRow>(
      `
        select job_id::text
        from public.fn_create_job(
          $1::uuid,
          $2::text,
          $3::text,
          $4::smallint,
          $5::text[],
          $6::text,
          '[]'::jsonb,
          $7::text,
          $8::text,
          $9::text,
          $10::integer,
          $11::text[],
          $12::integer
        )
        limit 1
      `,
      [
        organizationId,
        jobTitle,
        jobDescription,
        experienceLevelId,
        coreSkills,
        difficultyProfile,
        codingRequired,
        input.coding ? "LIVE_CODING" : null,
        input.coding ? "MEDIUM" : null,
        input.coding ? Math.min(30, Math.max(10, Math.floor(duration / 2))) : null,
        input.coding ? ["javascript", "typescript"] : [],
        duration,
      ]
    );

    const jobId = created.rows[0]?.job_id;
    if (jobId) return jobId;
  }

  const fallback = await query<JobRow>(
    `
      insert into public.job_positions (
        organization_id,
        job_title,
        job_description,
        experience_level_id,
        core_skills,
        difficulty_profile,
        interview_duration_minutes
      )
      values ($1::uuid, $2, $3, $4::smallint, $5::text[], $6::public.difficulty_profile, $7)
      returning job_id::text
    `,
    [organizationId, jobTitle, jobDescription, experienceLevelId, coreSkills, difficultyProfile, duration]
  );

  const jobId = fallback.rows[0]?.job_id;
  if (!jobId) {
    throw new Error("PRACTICE_JOB_CREATE_FAILED");
  }

  return jobId;
}

export async function createPracticeInterview(input: PracticeInterviewInput) {
  const support = await getSchemaSupport();
  const candidate = await ensurePracticeCandidate(input);
  const jobId = await ensurePracticeJob(input, candidate.organizationId);

  if (!support.fn_create_interview_link) {
    throw new Error("INTERVIEW_LINK_FUNCTION_MISSING");
  }

  const appUrl =
    process.env.CALM_ROOM_APP_URL ||
    process.env.NEXT_PUBLIC_CALM_ROOM_URL ||
    process.env.NEXT_PUBLIC_CALM_ROOM_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const { rows } = await query<InterviewLinkRow>(
    `
      select interview_id::text, token, link
      from public.fn_create_interview_link(
        $1::uuid,
        $2::uuid,
        $3::uuid,
        'FLEXIBLE',
        null::timestamptz,
        null::timestamptz,
        $4::text
      )
      limit 1
    `,
    [candidate.organizationId, jobId, candidate.candidateId, appUrl]
  );

  const interview = rows[0];
  if (!interview?.interview_id || !interview.token || !interview.link) {
    throw new Error("INTERVIEW_LINK_CREATE_FAILED");
  }

  return {
    ...candidate,
    jobId,
    interviewId: interview.interview_id,
    token: interview.token,
    link: interview.link,
  };
}

export async function getPracticeDashboard(identityId?: string): Promise<PracticeDashboardData> {
  if (!identityId || !UUID_PATTERN.test(identityId)) {
    return {
      schema: EMPTY_SCHEMA_SUPPORT,
      candidate: null,
      interviews: [],
    };
  }

  const support = await getSchemaSupport();

  if (!support.candidate_identity_links) {
    return {
      schema: support,
      candidate: null,
      interviews: [],
    };
  }

  const { rows } = await query(
    `
      select
        c.candidate_id::text as "candidateId",
        c.full_name as "fullName",
        c.email,
        c.created_at::text as "createdAt",
        c.organization_id::text as "organizationId",
        o.organization_name as "organizationName",
        coalesce(jsonb_agg(
          jsonb_build_object(
            'interviewId', i.interview_id::text,
            'jobId', i.job_id::text,
            'jobTitle', jp.job_title,
            'status', i.status,
            'interviewType', i.interview_type,
            'createdAt', i.created_at,
            'durationMinutes', i.duration_minutes,
            'token', ii.token,
            'expiresAt', ii.expires_at
          )
          order by i.created_at desc
        ) filter (where i.interview_id is not null), '[]'::jsonb) as interviews
      from public.candidate_identity_links cil
      join public.candidates c on c.candidate_id = cil.candidate_id
      left join public.organizations o on o.organization_id = c.organization_id
      left join public.interviews i on i.candidate_id = c.candidate_id
      left join public.job_positions jp on jp.job_id = i.job_id
      left join public.interview_invites ii on ii.interview_id = i.interview_id
      where cil.identity_id = $1::uuid
        and cil.purpose = 'practice'
      group by c.candidate_id, c.full_name, c.email, c.created_at, c.organization_id, o.organization_name
      order by c.created_at desc
      limit 1
    `,
    [identityId]
  );

  const candidate = rows[0] as
    | {
        candidateId: string;
        fullName: string | null;
        email: string | null;
        createdAt: string | null;
        organizationId: string | null;
        organizationName: string | null;
        interviews: PracticeDashboardInterview[];
      }
    | undefined;

  return {
    schema: support,
    candidate: candidate
      ? {
          candidateId: candidate.candidateId,
          fullName: candidate.fullName,
          email: candidate.email,
          createdAt: candidate.createdAt,
          organizationId: candidate.organizationId,
          organizationName: candidate.organizationName,
        }
      : null,
    interviews: candidate?.interviews ?? [],
  };
}
