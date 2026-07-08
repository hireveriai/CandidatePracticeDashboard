import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import { recentInterviews } from "@/components/practice/data";

export default function HistoryPage() {
  return (
    <PracticeShell>
      <PageHeader
        eyebrow="Interview history"
        title="Review every practice session"
        description="A candidate-focused record of mock interviews, scores, coaching themes, and next best actions."
      />

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 px-5 py-4 text-sm font-semibold text-slate-500 md:grid-cols-[1fr_0.7fr_0.4fr_0.8fr]">
          <span>Session</span>
          <span>Type</span>
          <span>Score</span>
          <span>Coach note</span>
        </div>
        <div className="divide-y divide-slate-100">
          {recentInterviews.map((item) => (
            <div key={`${item.role}-${item.date}`} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_0.7fr_0.4fr_0.8fr]">
              <div>
                <p className="font-semibold text-slate-950">{item.role}</p>
                <p className="mt-1 text-sm text-slate-500">{item.date}</p>
              </div>
              <p className="text-sm text-slate-600">{item.type}</p>
              <p className="font-semibold text-blue-700">{item.score}/10</p>
              <p className="text-sm text-slate-600">{item.status}</p>
            </div>
          ))}
        </div>
      </section>
    </PracticeShell>
  );
}
