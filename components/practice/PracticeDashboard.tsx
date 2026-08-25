import Link from "next/link";
import {
  ArrowRight,
  Award,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { PracticeDashboardData } from "@/lib/server/practice-candidate";
import type { PracticePricingData } from "@/lib/server/practice-pricing";
import type { PracticeEntitlementState } from "@/lib/server/practice-entitlement";
import FreePracticeCard from "@/components/practice/FreePracticeCard";
import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import PracticePricing from "@/components/practice/PracticePricing";
import StatCard from "@/components/practice/StatCard";

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function isCompletedStatus(status: string | null) {
  return ["completed", "complete", "evaluated", "finished"].includes(
    status?.toLowerCase() ?? ""
  );
}

function getDisplayName(fullName: string | null) {
  const value = fullName?.trim();
  return value && value !== "Practice Candidate" ? value : "Candidate";
}

export default function PracticeDashboard({
  data,
  pricing,
  entitlement,
}: {
  data: PracticeDashboardData;
  pricing: PracticePricingData;
  entitlement: PracticeEntitlementState;
}) {
  const candidateName = getDisplayName(data.candidate?.fullName ?? null);
  const interviews = data.interviews;
  const completedCount = interviews.filter((item) =>
    isCompletedStatus(item.status)
  ).length;
  const activeJobs = new Set(
    interviews.map((item) => item.jobId).filter(Boolean)
  ).size;
  const latestInterview = interviews[0] ?? null;
  const organizationName = data.candidate?.organizationName ?? "Your organization";
  const paidCredits = pricing.subscription?.remainingCredits ?? 0;
  const freeCredits = entitlement.freeCreditsRemaining;
  const canStartInterview = paidCredits > 0 || freeCredits > 0;

  return (
    <PracticeShell candidateName={candidateName}>
      <PageHeader
        eyebrow="Practice dashboard"
        title={`Welcome, ${candidateName}`}
        description={`${organizationName} practice data from VerisNova interviews and candidate setup.`}
      />

      <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-50 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                <Sparkles size={16} aria-hidden="true" />
                Recommended next step
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                {latestInterview?.jobTitle
                  ? `Continue practice for ${latestInterview.jobTitle}`
                  : "Start your first practice interview"}
              </h2>
              <p className="mt-2 max-w-2xl text-slate-600">
                {latestInterview
                  ? `Latest session status: ${latestInterview.status ?? "pending"}.`
                  : "No practice interview has been created for this candidate yet."}
              </p>
            </div>
            {canStartInterview ? (
              <Link
                href="/interview/setup?mode=practice"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
              >
                Start Interview
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            ) : (
              <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-100 px-4 text-sm font-semibold text-slate-500">
                No practice credits yet
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <BrainCircuit size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-950">Candidate record</h2>
              <p className="mt-2 truncate text-sm leading-6 text-slate-600">
                {data.candidate?.email ?? "No candidate email found for this session."}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Organization: {organizationName}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total interviews"
          value={String(interviews.length)}
          detail="from organization data"
          icon={ClipboardList}
        />
        <StatCard
          label="Completed interviews"
          value={String(completedCount)}
          detail="from interview status"
          icon={CheckCircle2}
        />
        <StatCard label="Practice roles" value={String(activeJobs)} detail="linked job positions" icon={Award} />
        <StatCard
          label="Practice credits"
          value={String(paidCredits + freeCredits)}
          detail={
            freeCredits > 0 && paidCredits > 0
              ? "free + paid credits"
              : freeCredits > 0
                ? "free practice credit"
                : paidCredits > 0
                  ? "paid subscription credits"
                  : "no credits yet"
          }
          icon={Wallet}
        />
      </section>

      <FreePracticeCard entitlement={entitlement} hasPaidCredits={paidCredits > 0} />

      <PracticePricing pricing={pricing} />

      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950">Recent interviews</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              Latest practice: {latestInterview ? formatDate(latestInterview.createdAt) : "No sessions yet"}
            </span>
            <Link
              href="/history"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              View all
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="grid gap-3">
          {interviews.length ? (
            interviews.slice(0, 5).map((item) => (
              <div
                key={item.interviewId}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-100 hover:bg-blue-50/40"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-semibold text-slate-950">{item.jobTitle ?? "Practice interview"}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.interviewType ?? "Interview"} - {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-white px-3 py-1 text-sm font-semibold text-slate-950">
                      {item.durationMinutes ? `${item.durationMinutes} min` : "Flexible"}
                    </span>
                    <span className="text-sm text-slate-500">{item.status ?? "Pending"}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              No interviews found yet. Start a practice interview to create the first organization-backed record.
            </div>
          )}
        </div>
      </section>
    </PracticeShell>
  );
}
