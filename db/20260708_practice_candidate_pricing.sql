-- HireVeri Practice Candidate pricing and paid-credit subscription support.
-- Uses the existing public.hireveri_plans and public.hireveri_user_subscriptions tables.
-- This script does not create or seed trial credits for practice candidates.

begin;

create table if not exists public.hireveri_plans (
  "id" text primary key,
  "name" text not null,
  "slug" text not null unique,
  "price" integer not null,
  "interviewLimit" integer not null,
  "screeningCredits" integer not null default 0,
  "planType" text not null default 'INTERVIEW',
  "description" text,
  "features" jsonb not null default '[]'::jsonb,
  "order" integer not null,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.hireveri_plans
  add column if not exists "screeningCredits" integer not null default 0,
  add column if not exists "planType" text not null default 'INTERVIEW',
  add column if not exists "description" text,
  add column if not exists "features" jsonb not null default '[]'::jsonb,
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

create index if not exists hireveri_plans_type_active_order_idx
  on public.hireveri_plans ("planType", "isActive", "order");

create table if not exists public.hireveri_user_subscriptions (
  "id" text primary key,
  "userId" text not null unique,
  "planId" text not null references public.hireveri_plans ("id") on delete restrict on update cascade,
  "totalCredits" integer not null,
  "usedCredits" integer not null default 0,
  "startedAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.hireveri_user_subscriptions
  add column if not exists "screeningCredits" integer not null default 0,
  add column if not exists "status" text not null default 'active',
  add column if not exists "expiresAt" timestamptz,
  add column if not exists "currency" text not null default 'INR',
  add column if not exists "amountPaid" integer not null default 0,
  add column if not exists "startedAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

create index if not exists hireveri_user_subscriptions_user_status_idx
  on public.hireveri_user_subscriptions ("userId", "status");

insert into public.hireveri_plans
  ("id", "name", "slug", "price", "interviewLimit", "screeningCredits", "planType", "order", "isActive", "description", "features")
values
  (
    'practice-candidate-starter-plan',
    'Starter',
    'practice-starter',
    299,
    1,
    0,
    'PRACTICE_CANDIDATE',
    101,
    true,
    'One focused VERIS AI practice interview for candidates preparing for an upcoming hiring conversation.',
    '["VERIS AI Interview","Coding Round if applicable","AI Report","Transcript","Interview Replay","Career Insights","Skill Gap Analysis"]'::jsonb
  ),
  (
    'practice-candidate-professional-plan',
    'Professional',
    'practice-professional',
    799,
    3,
    0,
    'PRACTICE_CANDIDATE',
    102,
    true,
    'Three guided practice interviews for candidates improving behavioral, technical, and role-specific confidence.',
    '["VERIS AI Interview","Coding Round if applicable","AI Report","Transcript","Interview Replay","Career Insights","Skill Gap Analysis"]'::jsonb
  ),
  (
    'practice-candidate-advanced-plan',
    'Advanced',
    'practice-advanced',
    1199,
    5,
    0,
    'PRACTICE_CANDIDATE',
    103,
    true,
    'Five interview simulations with repeated feedback cycles for stronger readiness across multiple roles.',
    '["VERIS AI Interview","Coding Round if applicable","AI Report","Transcript","Interview Replay","Career Insights","Skill Gap Analysis","Resume Analysis"]'::jsonb
  ),
  (
    'practice-candidate-career-accelerator-plan',
    'Career Accelerator',
    'practice-career-accelerator',
    1999,
    10,
    0,
    'PRACTICE_CANDIDATE',
    104,
    true,
    'Ten practice interviews for intensive preparation, reports, and career readiness insights.',
    '["VERIS AI Interview","Coding Round if applicable","AI Report","Transcript","Interview Replay","Career Insights","Skill Gap Analysis","Resume Analysis","Global Role Recommendations"]'::jsonb
  )
on conflict ("slug") do update set
  "name" = excluded."name",
  "price" = excluded."price",
  "interviewLimit" = excluded."interviewLimit",
  "screeningCredits" = excluded."screeningCredits",
  "planType" = excluded."planType",
  "order" = excluded."order",
  "isActive" = excluded."isActive",
  "description" = excluded."description",
  "features" = excluded."features",
  "updatedAt" = now();

commit;
