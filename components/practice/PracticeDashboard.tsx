import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarCheck2,
  Sparkles,
} from "lucide-react";
import type { PracticeDashboardData } from "@/lib/server/practice-candidate";
import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
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
}: {
  data: PracticeDashboardData;
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
  const jobTitles = Array.from(
    new Set(interviews.map((item) => item.jobTitle).filter(Boolean))
  ) as string[];

  return (
    <PracticeShell candidateName={candidateName}>
      <PageHeader
        eyebrow="Practice dashboard"
        title={`Welcome, ${candidateName}`}
        description={`${organizationName} practice data from HireVeri interviews and candidate setup.`}
      />

      <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
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
            <Link
              href="/interview/setup?mode=practice"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Start Interview
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <BrainCircuit className="mt-1 text-indigo-600" size={24} aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Candidate record</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
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
        <StatCard label="Total interviews" value={String(interviews.length)} detail="from organization data" />
        <StatCard label="Completed interviews" value={String(completedCount)} detail="from interview status" />
        <StatCard label="Practice roles" value={String(activeJobs)} detail="linked job positions" />
        <StatCard label="Candidate profile" value={data.candidate ? "Ready" : "Missing"} detail="from onboarding data" />
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-950">Recent interviews</h2>
            <Link href="/history" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              View all
            </Link>
          </div>
          <div className="grid gap-3">
            {interviews.length ? (
              interviews.slice(0, 5).map((item) => (
                <div key={item.interviewId} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
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
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
            <BriefcaseBusiness size={19} aria-hidden="true" />
            Organization roles
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {jobTitles.length ? (
              jobTitles.map((role) => (
                <span key={role} className="rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                  {role}
                </span>
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                Roles will appear here after the organization creates practice interviews for this candidate.
              </p>
            )}
          </div>
          <div className="mt-5 flex items-center gap-3 rounded-lg bg-indigo-50 p-4 text-sm text-indigo-900">
            <CalendarCheck2 size={19} aria-hidden="true" />
            <span>
              Latest practice: {latestInterview ? formatDate(latestInterview.createdAt) : "No sessions yet"}
            </span>
          </div>
        </div>
      </section>
    </PracticeShell>
  );
}
