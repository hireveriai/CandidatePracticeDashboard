import { BriefcaseBusiness } from "lucide-react";
import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import { getPracticeDashboard } from "@/lib/server/practice-candidate";
import { getSessionIdentityId } from "@/lib/server/session";

export default async function CareerInsightsPage() {
  const identityId = await getSessionIdentityId();
  const data = await getPracticeDashboard(identityId ?? undefined);

  const jobTitles = Array.from(new Set(data.interviews.map((item) => item.jobTitle).filter(Boolean))) as string[];
  const interviewTypes = Array.from(
    new Set(data.interviews.map((item) => item.interviewType).filter(Boolean))
  ) as string[];

  return (
    <PracticeShell candidateName={data.candidate?.fullName ?? undefined}>
      <PageHeader
        eyebrow="Career insights"
        title="Practice toward the right opportunities"
        description="Built from the roles and interview formats you've actually practiced for."
      />

      <section className="grid gap-5 lg:grid-cols-2">
        <InsightBlock title="Roles you've practiced for" items={jobTitles} tone="blue" />
        <InsightBlock title="Interview formats you've practiced" items={interviewTypes} tone="teal" />
      </section>

      {!jobTitles.length && !interviewTypes.length ? (
        <section className="mt-5 flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <BriefcaseBusiness size={26} aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-slate-950">No practice history yet</h2>
          <p className="max-w-md text-sm leading-6 text-slate-600">
            Career insights build up automatically from the roles and interview types you practice. Start your
            first practice interview to see them here.
          </p>
        </section>
      ) : null}
    </PracticeShell>
  );
}

function InsightBlock({ title, items, tone }: { title: string; items: string[]; tone: "blue" | "teal" }) {
  const classes = tone === "blue" ? "bg-blue-50 text-blue-700" : "bg-teal-50 text-teal-700";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      {items.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className={`rounded-md px-3 py-2 text-sm font-semibold ${classes}`}>
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-slate-600">Nothing here yet — this fills in as you practice.</p>
      )}
    </div>
  );
}
