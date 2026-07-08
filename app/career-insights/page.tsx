import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import { industries, recommendedRoles } from "@/components/practice/data";

export default function CareerInsightsPage() {
  return (
    <PracticeShell>
      <PageHeader
        eyebrow="Career insights"
        title="Practice toward the right opportunities"
        description="Role and industry guidance that keeps mock interviews aligned with the candidate's next hiring move."
      />

      <section className="grid gap-5 lg:grid-cols-2">
        <InsightBlock title="Recommended roles" items={recommendedRoles} tone="blue" />
        <InsightBlock title="Industries to prepare for" items={industries} tone="teal" />
      </section>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Market-ready coaching plan</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {["Clarify role stories", "Practice domain scenarios", "Prepare thoughtful questions"].map((item) => (
            <div key={item} className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </section>
    </PracticeShell>
  );
}

function InsightBlock({ title, items, tone }: { title: string; items: string[]; tone: "blue" | "teal" }) {
  const classes = tone === "blue" ? "bg-blue-50 text-blue-700" : "bg-teal-50 text-teal-700";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className={`rounded-md px-3 py-2 text-sm font-semibold ${classes}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
