import { CheckCircle2, Info } from "lucide-react";
import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import PrecheckReadyAction from "@/components/practice/PrecheckReadyAction";
import { precheckItems } from "@/components/practice/data";

export default async function InterviewPrecheck({
  searchParams,
}: {
  searchParams: Promise<{
    link?: string;
    token?: string;
    interviewId?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <PracticeShell>
      <PageHeader
        eyebrow="Interview readiness"
        title="Check your setup before Veris begins"
        description="This mirrors the recruiter interview pre-check experience and keeps the practice flow ready for the existing interview engine handoff."
      />

      <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-4 md:grid-cols-2">
          {precheckItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <Icon className="text-blue-600" size={24} aria-hidden="true" />
                  <CheckCircle2 className="text-teal-600" size={21} aria-label="Passed" />
                </div>
                <h2 className="mt-5 text-lg font-semibold text-slate-950">{item.label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                <p className="mt-4 rounded-md bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700">
                  Ready
                </p>
              </div>
            );
          })}
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Instructions</h2>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
            <p>Keep your face centered and use a quiet environment.</p>
            <p>Answer naturally. Veris evaluates clarity, structure, confidence, and role fit.</p>
            <p>For coding sessions, the existing coding interview flow opens when the interview requires it.</p>
          </div>
          <div className="mt-5 flex gap-3 rounded-lg bg-indigo-50 p-4 text-sm text-indigo-900">
            <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>Placeholder readiness states are frontend-only and integration-ready for production checks.</span>
          </div>
          <PrecheckReadyAction
            link={params.link}
            token={params.token}
            interviewId={params.interviewId}
          />
        </aside>
      </section>
    </PracticeShell>
  );
}
