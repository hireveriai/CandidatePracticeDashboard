import { History as HistoryIcon } from "lucide-react";
import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import { getPracticeDashboard } from "@/lib/server/practice-candidate";
import { getSessionIdentityId } from "@/lib/server/session";

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function HistoryPage() {
  const identityId = await getSessionIdentityId();
  const data = await getPracticeDashboard(identityId ?? undefined);
  const interviews = data.interviews;

  return (
    <PracticeShell candidateName={data.candidate?.fullName ?? undefined}>
      <PageHeader
        eyebrow="Interview history"
        title="Review every practice session"
        description="A candidate-focused record of mock interviews created for this account, pulled directly from VerisNova organization data."
      />

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {interviews.length ? (
          <>
            <div className="grid gap-3 border-b border-slate-200 px-5 py-4 text-sm font-semibold text-slate-500 md:grid-cols-[1fr_0.7fr_0.5fr_0.7fr]">
              <span>Role</span>
              <span>Type</span>
              <span>Duration</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-slate-100">
              {interviews.map((item) => (
                <div
                  key={item.interviewId}
                  className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_0.7fr_0.5fr_0.7fr] md:items-center"
                >
                  <div>
                    <p className="font-semibold text-slate-950">{item.jobTitle ?? "Practice interview"}</p>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(item.createdAt)}</p>
                  </div>
                  <p className="text-sm text-slate-600">{item.interviewType ?? "Interview"}</p>
                  <p className="text-sm text-slate-600">
                    {item.durationMinutes ? `${item.durationMinutes} min` : "Flexible"}
                  </p>
                  <p className="text-sm font-semibold text-blue-700">{item.status ?? "Pending"}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <HistoryIcon size={22} aria-hidden="true" />
            </span>
            <p className="text-sm text-slate-600">
              No interviews found yet. Sessions you start will show up here as soon as they&rsquo;re created.
            </p>
          </div>
        )}
      </section>
    </PracticeShell>
  );
}
