import Link from "next/link";
import { Target } from "lucide-react";
import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import { getPracticeDashboard } from "@/lib/server/practice-candidate";
import { getSessionIdentityId } from "@/lib/server/session";

function isCompletedStatus(status: string | null) {
  return ["completed", "complete", "evaluated", "finished"].includes(status?.toLowerCase() ?? "");
}

export default async function SkillsPage() {
  const identityId = await getSessionIdentityId();
  const data = await getPracticeDashboard(identityId ?? undefined);
  const completedCount = data.interviews.filter((item) => isCompletedStatus(item.status)).length;

  return (
    <PracticeShell candidateName={data.candidate?.fullName ?? undefined}>
      <PageHeader
        eyebrow="Skill progress"
        title="Track the abilities that move interviews"
        description="Per-skill scoring unlocks once VERIS has evaluated a completed interview for this account."
      />

      <section className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Target size={26} aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-slate-950">
          {completedCount > 0 ? "Skill scoring is coming soon" : "No skill data yet"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          {completedCount > 0
            ? `You have ${completedCount} completed ${completedCount === 1 ? "interview" : "interviews"}. Structured, per-skill scoring for communication, technical depth, and confidence will appear here as soon as it's available for this account.`
            : "Complete a practice interview to start building a skill profile — structured answers, technical depth, confidence, and follow-up quality."}
        </p>
        <Link
          href="/interview/setup"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          {completedCount > 0 ? "Practice another interview" : "Start your first practice interview"}
        </Link>
      </section>
    </PracticeShell>
  );
}
