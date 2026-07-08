import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import ProgressBar from "@/components/practice/ProgressBar";
import { skillProgress } from "@/components/practice/data";

export default function SkillsPage() {
  return (
    <PracticeShell>
      <PageHeader
        eyebrow="Skill progress"
        title="Track the abilities that move interviews"
        description="Focused progress cards for answer structure, depth, confidence, communication, and follow-up quality."
      />

      <section className="grid gap-5 lg:grid-cols-2">
        {skillProgress.map((skill) => (
          <div key={skill.label} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <ProgressBar {...skill} />
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Recommended drill: complete one focused practice answer and review Veris coaching before the next full interview.
            </p>
          </div>
        ))}
      </section>
    </PracticeShell>
  );
}
