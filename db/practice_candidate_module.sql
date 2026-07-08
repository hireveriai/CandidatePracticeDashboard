-- Practice Candidate DB contract for hireveri-candidate.
-- This module intentionally reuses existing HireVeri tables and functions:
--   public.sp_create_practice_candidate
--   public.fn_create_job
--   public.fn_create_interview_link
--   public.fn_validate_interview_token
--
-- Run this only in environments where the identity architecture migration has
-- not already been applied. Existing objects are left intact.

create extension if not exists pgcrypto;

create table if not exists public.candidate_identity_links (
  identity_id uuid not null references public.identity_users(identity_id) on delete cascade,
  candidate_id uuid not null references public.candidates(candidate_id) on delete cascade,
  purpose text not null default 'practice',
  created_at timestamptz not null default now(),
  primary key (identity_id, candidate_id)
);

create index if not exists idx_candidate_identity_links_identity
  on public.candidate_identity_links (identity_id, purpose, created_at desc);

create index if not exists idx_candidate_identity_links_candidate
  on public.candidate_identity_links (candidate_id);

create index if not exists idx_candidates_org_email_lookup
  on public.candidates (organization_id, lower(email))
  where email is not null;

create index if not exists idx_interview_invites_interview_id
  on public.interview_invites (interview_id);

create index if not exists idx_interviews_candidate_created
  on public.interviews (candidate_id, created_at desc);
