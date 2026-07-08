-- HireVeri Practice Candidate module migration
-- Date: 2026-07-08
--
-- Purpose:
--   Adds the DB contract needed by hireveri-candidate while reusing the
--   existing HireVeri interview engine tables/functions.
--
-- Safe to rerun:
--   Uses create-if-not-exists, add-column-if-not-exists, create-or-replace,
--   and non-destructive indexes.
--
-- Expected existing core objects:
--   public.organizations
--   public.identity_users
--   public.candidates
--   public.job_positions
--   public.experience_level_pool
--   public.global_skill_pool
--   public.interviews
--   public.interview_invites
--   public.interview_configs
--   public.evaluation_template_pool
--   public.fn_create_job(...)
--   public.fn_create_interview_link(...)

begin;

create extension if not exists pgcrypto;

do $$
declare
  missing text[];
begin
  select array_agg(name)
  into missing
  from (
    values
      ('public.organizations'),
      ('public.identity_users'),
      ('public.candidates'),
      ('public.job_positions'),
      ('public.experience_level_pool'),
      ('public.global_skill_pool'),
      ('public.interviews'),
      ('public.interview_invites'),
      ('public.interview_configs'),
      ('public.evaluation_template_pool')
  ) required(name)
  where to_regclass(required.name) is null;

  if missing is not null then
    raise exception 'PRACTICE_CANDIDATE_PREREQUISITES_MISSING: %', array_to_string(missing, ', ');
  end if;
end $$;

alter table public.candidates
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists primary_role_id uuid,
  add column if not exists experience_level_code text,
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if to_regclass('public.global_role_pool') is not null
    and not exists (
      select 1
      from pg_constraint
      where conname = 'candidates_primary_role_id_fkey'
        and conrelid = 'public.candidates'::regclass
    )
  then
    alter table public.candidates
      add constraint candidates_primary_role_id_fkey
      foreign key (primary_role_id)
      references public.global_role_pool(role_pool_id);
  end if;

  if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'experience_level_pool'
        and column_name = 'code'
    )
    and not exists (
      select 1
      from pg_constraint
      where conname = 'candidates_experience_level_code_fkey'
        and conrelid = 'public.candidates'::regclass
    )
  then
    alter table public.candidates
      add constraint candidates_experience_level_code_fkey
      foreign key (experience_level_code)
      references public.experience_level_pool(code);
  end if;
end $$;

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

create table if not exists public.candidate_primary_skills (
  candidate_id uuid not null references public.candidates(candidate_id) on delete cascade,
  skill_id uuid not null references public.global_skill_pool(skill_id),
  confidence_score int,
  created_at timestamptz not null default now(),
  primary key (candidate_id, skill_id)
);

create index if not exists idx_candidates_org_email_lookup
  on public.candidates (organization_id, lower(email))
  where email is not null;

create index if not exists idx_interviews_candidate_created
  on public.interviews (candidate_id, created_at desc);

create index if not exists idx_interviews_org_candidate_created
  on public.interviews (organization_id, candidate_id, created_at desc);

create index if not exists idx_interview_invites_interview_id
  on public.interview_invites (interview_id);

create index if not exists idx_interview_invites_token_lookup
  on public.interview_invites (token);

create index if not exists idx_job_positions_practice_lookup
  on public.job_positions (organization_id, job_title, interview_duration_minutes);

create or replace function public.sp_create_practice_candidate(
  p_identity_id uuid,
  p_email text,
  p_full_name text default null::text
)
returns table (
  user_id uuid,
  organization_id uuid,
  created_new boolean
)
language plpgsql
as $function$
declare
  v_candidate_id uuid;
  v_org_id uuid;
  v_email text := lower(nullif(btrim(p_email), ''));
  v_full_name text := coalesce(nullif(btrim(p_full_name), ''), 'Practice Candidate');
  v_created_new boolean := false;
begin
  if p_identity_id is null then
    raise exception 'IDENTITY_REQUIRED: identity_id is required';
  end if;

  if v_email is null then
    raise exception 'EMAIL_REQUIRED: email is required';
  end if;

  insert into public.identity_users (
    identity_id,
    email,
    primary_email,
    intent,
    is_verified
  )
  values (
    p_identity_id,
    v_email,
    v_email,
    'candidate_practice',
    true
  )
  on conflict (identity_id) do update
  set
    email = excluded.email,
    primary_email = excluded.primary_email,
    intent = 'candidate_practice',
    is_verified = true;

  select o.organization_id
  into v_org_id
  from public.organizations o
  where lower(o.organization_name) in ('practice arena', 'practice')
  order by case when lower(o.organization_name) = 'practice arena' then 0 else 1 end
  limit 1;

  if v_org_id is null then
    insert into public.organizations (
      organization_name,
      is_active
    )
    values (
      'Practice Arena',
      true
    )
    returning organizations.organization_id into v_org_id;
  end if;

  select c.candidate_id
  into v_candidate_id
  from public.candidate_identity_links cil
  join public.candidates c
    on c.candidate_id = cil.candidate_id
  where cil.identity_id = p_identity_id
    and c.organization_id = v_org_id
  order by cil.created_at desc
  limit 1;

  if v_candidate_id is null then
    select c.candidate_id
    into v_candidate_id
    from public.candidates c
    where c.organization_id = v_org_id
      and lower(c.email) = v_email
    order by c.created_at desc
    limit 1;
  end if;

  if v_candidate_id is null then
    insert into public.candidates (
      organization_id,
      full_name,
      email,
      status
    )
    values (
      v_org_id,
      v_full_name,
      v_email,
      'INVITED'
    )
    returning candidates.candidate_id into v_candidate_id;

    v_created_new := true;
  else
    update public.candidates
    set
      email = v_email,
      full_name = coalesce(nullif(v_full_name, 'Practice Candidate'), full_name),
      updated_at = now()
    where candidate_id = v_candidate_id;
  end if;

  insert into public.candidate_identity_links (
    identity_id,
    candidate_id,
    purpose
  )
  values (
    p_identity_id,
    v_candidate_id,
    'practice'
  )
  on conflict (identity_id, candidate_id) do nothing;

  return query
  select v_candidate_id, v_org_id, v_created_new;
end;
$function$;

create or replace function public.sp_create_practice_candidate(
  p_email text,
  p_identity_id uuid
)
returns uuid
language plpgsql
as $function$
declare
  v_candidate_id uuid;
begin
  select r.user_id
  into v_candidate_id
  from public.sp_create_practice_candidate(
    p_identity_id,
    p_email,
    null::text
  ) r
  limit 1;

  return v_candidate_id;
end;
$function$;

create or replace function public.sp_complete_practice_candidate_onboarding(
  p_identity_id uuid,
  p_first_name text,
  p_last_name text,
  p_role_id uuid,
  p_experience_code text,
  p_skill_ids uuid[]
)
returns void
language plpgsql
as $function$
declare
  v_candidate_id uuid;
  v_org_id uuid;
  v_email text;
  v_full_name text := btrim(concat_ws(' ', nullif(p_first_name, ''), nullif(p_last_name, '')));
begin
  select lower(coalesce(i.primary_email, i.email))
  into v_email
  from public.identity_users i
  where i.identity_id = p_identity_id
  limit 1;

  if v_email is null then
    raise exception 'Identity email not found for %', p_identity_id;
  end if;

  select c.candidate_id, c.organization_id
  into v_candidate_id, v_org_id
  from public.candidate_identity_links cil
  join public.candidates c
    on c.candidate_id = cil.candidate_id
  where cil.identity_id = p_identity_id
  order by cil.created_at desc
  limit 1;

  if v_candidate_id is null then
    select r.user_id, r.organization_id
    into v_candidate_id, v_org_id
    from public.sp_create_practice_candidate(
      p_identity_id,
      v_email,
      nullif(v_full_name, '')
    ) r
    limit 1;
  end if;

  update public.candidates
  set
    first_name = nullif(p_first_name, ''),
    last_name = nullif(p_last_name, ''),
    full_name = coalesce(nullif(v_full_name, ''), full_name),
    primary_role_id = p_role_id,
    experience_level_code = p_experience_code,
    updated_at = now()
  where candidate_id = v_candidate_id;

  delete from public.candidate_primary_skills
  where candidate_id = v_candidate_id;

  insert into public.candidate_primary_skills (
    candidate_id,
    skill_id
  )
  select distinct v_candidate_id, unnest(coalesce(p_skill_ids, '{}'::uuid[]));
end;
$function$;

create or replace function public.fn_get_or_create_practice_job(
  p_organization_id uuid,
  p_role text,
  p_experience_label text default 'Mid level',
  p_difficulty text default 'Standard',
  p_interview_type text default 'Mixed',
  p_language text default 'English',
  p_duration_minutes integer default 30,
  p_include_coding boolean default false
)
returns table (
  job_id uuid
)
language plpgsql
as $function$
declare
  v_job_id uuid;
  v_job_title text := 'Practice - ' || coalesce(nullif(btrim(p_role), ''), 'Product Manager');
  v_duration integer := case
    when p_duration_minutes <= 30 then 30
    when p_duration_minutes <= 45 then 45
    else 60
  end;
  v_experience_level_id smallint := 2;
  v_difficulty_profile text := case
    when lower(coalesce(p_difficulty, '')) like '%warm%' then 'JUNIOR'
    when lower(coalesce(p_difficulty, '')) like '%challeng%' then 'SENIOR'
    else 'MID'
  end;
  v_core_skills text[] := array['communication', 'structured answers', 'role alignment'];
begin
  select elp.experience_level_id
  into v_experience_level_id
  from public.experience_level_pool elp
  where lower(elp.label) in (
    case
      when lower(coalesce(p_experience_label, '')) like '%entry%' then 'entry level'
      when lower(coalesce(p_experience_label, '')) like '%senior%' then 'senior'
      when lower(coalesce(p_experience_label, '')) like '%leadership%' then 'leadership'
      else 'mid level'
    end
  )
  order by elp.experience_level_id
  limit 1;

  v_experience_level_id := coalesce(v_experience_level_id, 2);

  select jp.job_id
  into v_job_id
  from public.job_positions jp
  where jp.organization_id = p_organization_id
    and jp.job_title = v_job_title
    and coalesce(jp.interview_duration_minutes, 30) = v_duration
  order by jp.job_id desc
  limit 1;

  if v_job_id is null then
    select created.job_id
    into v_job_id
    from public.fn_create_job(
      p_organization_id,
      v_job_title,
      concat(
        coalesce(nullif(btrim(p_interview_type), ''), 'Mixed'),
        ' practice interview in ',
        coalesce(nullif(btrim(p_language), ''), 'English'),
        '. Difficulty: ',
        coalesce(nullif(btrim(p_difficulty), ''), 'Standard'),
        '. Experience: ',
        coalesce(nullif(btrim(p_experience_label), ''), 'Mid level'),
        '.'
      ),
      v_experience_level_id,
      v_core_skills,
      v_difficulty_profile,
      '[]'::jsonb,
      case when p_include_coding then 'YES' else 'NO' end,
      case when p_include_coding then 'LIVE_CODING' else null end,
      case when p_include_coding then 'MEDIUM' else null end,
      case when p_include_coding then least(30, greatest(10, v_duration / 2)) else null end,
      case when p_include_coding then array['javascript', 'typescript']::text[] else array[]::text[] end,
      v_duration
    ) created
    limit 1;
  end if;

  if v_job_id is null then
    raise exception 'PRACTICE_JOB_CREATE_FAILED';
  end if;

  return query select v_job_id;
end;
$function$;

create or replace function public.fn_create_practice_interview_link(
  p_identity_id uuid,
  p_email text,
  p_full_name text,
  p_role text default 'Product Manager',
  p_experience_label text default 'Mid level',
  p_difficulty text default 'Standard',
  p_interview_type text default 'Mixed',
  p_language text default 'English',
  p_duration_minutes integer default 30,
  p_include_coding boolean default false,
  p_app_url text default 'http://localhost:3000'
)
returns table (
  candidate_id uuid,
  organization_id uuid,
  job_id uuid,
  interview_id uuid,
  token text,
  link text
)
language plpgsql
as $function$
declare
  v_candidate record;
  v_job_id uuid;
  v_link record;
begin
  select *
  into v_candidate
  from public.sp_create_practice_candidate(
    p_identity_id,
    p_email,
    p_full_name
  )
  limit 1;

  if v_candidate.user_id is null or v_candidate.organization_id is null then
    raise exception 'PRACTICE_CANDIDATE_CREATE_FAILED';
  end if;

  select created.job_id
  into v_job_id
  from public.fn_get_or_create_practice_job(
    v_candidate.organization_id,
    p_role,
    p_experience_label,
    p_difficulty,
    p_interview_type,
    p_language,
    p_duration_minutes,
    p_include_coding
  ) created
  limit 1;

  select *
  into v_link
  from public.fn_create_interview_link(
    v_candidate.organization_id,
    v_job_id,
    v_candidate.user_id,
    'FLEXIBLE',
    null::timestamptz,
    null::timestamptz,
    p_app_url
  )
  limit 1;

  return query
  select
    v_candidate.user_id,
    v_candidate.organization_id,
    v_job_id,
    v_link.interview_id,
    v_link.token,
    v_link.link;
end;
$function$;

create or replace view public.v_practice_candidate_interviews as
select
  cil.identity_id,
  c.candidate_id,
  c.organization_id,
  c.full_name,
  c.email,
  i.interview_id,
  i.job_id,
  jp.job_title,
  i.interview_type,
  i.status as interview_status,
  i.duration_minutes,
  i.created_at as interview_created_at,
  ii.invite_id,
  ii.token,
  ii.status as invite_status,
  ii.expires_at,
  ii.used_at,
  ii.created_at as invite_created_at
from public.candidate_identity_links cil
join public.candidates c
  on c.candidate_id = cil.candidate_id
left join public.interviews i
  on i.candidate_id = c.candidate_id
left join public.job_positions jp
  on jp.job_id = i.job_id
left join public.interview_invites ii
  on ii.interview_id = i.interview_id
where cil.purpose = 'practice';

commit;
