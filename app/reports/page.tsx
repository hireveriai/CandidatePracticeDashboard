import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import StatCard from "@/components/practice/StatCard";
import { reportHighlights, scoreCards } from "@/components/practice/data";

export default function ReportsPage() {
  return (
    <PracticeShell>
      <PageHeader
        eyebrow="Reports"
        title="Understand what is improving"
        description="Modern report summaries for scoring, transcript-ready insights, AI evaluation themes, and recommended drills."
      />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {scoreCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">AI evaluation summary</h2>
          <div className="mt-5 grid gap-3">
            {reportHighlights.map((item) => (
              <p key={item} className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {item}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Transcript themes</h2>
          <div className="mt-5 grid gap-4">
            {["STAR structure", "Filler reduction", "Role examples", "Closing questions"].map((theme, index) => (
              <div key={theme}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{theme}</span>
                  <span className="font-semibold text-slate-950">{88 - index * 7}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${88 - index * 7}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PracticeShell>
  );
}
