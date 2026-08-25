import { CheckCircle2, ClipboardList, FileBarChart, Layers } from "lucide-react";
import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import StatCard from "@/components/practice/StatCard";
import { getPracticeDashboard } from "@/lib/server/practice-candidate";
import { getSessionIdentityId } from "@/lib/server/session";

function isCompletedStatus(status: string | null) {
  return ["completed", "complete", "evaluated", "finished"].includes(status?.toLowerCase() ?? "");
}

export default async function ReportsPage() {
  const identityId = await getSessionIdentityId();
  const data = await getPracticeDashboard(identityId ?? undefined);
  const interviews = data.interviews;

  const completed = interviews.filter((item) => isCompletedStatus(item.status));
  const activeJobs = new Set(interviews.map((item) => item.jobId).filter(Boolean)).size;

  const typeBreakdown = Object.entries(
    interviews.reduce<Record<string, number>>((acc, item) => {
      const key = item.interviewType?.trim() || "Unspecified";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <PracticeShell candidateName={data.candidate?.fullName ?? undefined}>
      <PageHeader
        eyebrow="Reports"
        title="Understand what is improving"
        description="Real counts from your VerisNova practice interviews — no simulated scores."
      />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total interviews" value={String(interviews.length)} detail="from organization data" icon={ClipboardList} />
        <StatCard label="Completed" value={String(completed.length)} detail="from interview status" icon={CheckCircle2} />
        <StatCard label="Roles practiced" value={String(activeJobs)} detail="linked job positions" icon={Layers} />
        <StatCard
          label="Interview types"
          value={String(typeBreakdown.length)}
          detail={typeBreakdown.length ? "distinct formats practiced" : "none yet"}
          icon={FileBarChart}
        />
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Completed sessions</h2>
          {completed.length ? (
            <div className="mt-5 grid gap-3">
              {completed.map((item) => (
                <div key={item.interviewId} className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  <p className="font-semibold text-slate-950">{item.jobTitle ?? "Practice interview"}</p>
                  <p className="mt-1 text-slate-600">
                    {item.interviewType ?? "Interview"} · status: {item.status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Detailed report summaries appear here once an interview has been completed. Start a practice
              interview to generate your first one.
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Interview type breakdown</h2>
          {typeBreakdown.length ? (
            <div className="mt-5 grid gap-4">
              {typeBreakdown.map(([type, count]) => {
                const percent = Math.round((count / interviews.length) * 100);
                return (
                  <div key={type}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{type}</span>
                      <span className="font-semibold text-slate-950">
                        {count} {count === 1 ? "interview" : "interviews"}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              No interviews yet, so there&rsquo;s nothing to break down. This fills in automatically as you
              practice.
            </p>
          )}
        </div>
      </section>
    </PracticeShell>
  );
}
