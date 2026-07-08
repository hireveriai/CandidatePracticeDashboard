import Link from "next/link";
import { ArrowRight, BrainCircuit, CalendarCheck2, Sparkles } from "lucide-react";
import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import ProgressBar from "@/components/practice/ProgressBar";
import StatCard from "@/components/practice/StatCard";
import {
  industries,
  journey,
  recentInterviews,
  recommendedRoles,
  scoreCards,
  skillProgress,
} from "@/components/practice/data";

export default function Dashboard() {
  return (
    <PracticeShell>
      <PageHeader
        eyebrow="Practice dashboard"
        title="Prepare calmly. Improve deliberately."
        description="A candidate-first command center for mock interviews, coaching, progress tracking, and career preparation."
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
                Run a 30 minute Product Manager mock interview
              </h2>
              <p className="mt-2 max-w-2xl text-slate-600">
                Veris will focus on structured answers, concise examples, and a calm closing question.
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
              <h2 className="text-lg font-semibold text-slate-950">AI coach note</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                You sound most confident when you answer with context, action, and result. Keep the first sentence short.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {scoreCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Skill snapshot</h2>
          <div className="mt-5 grid gap-5">
            {skillProgress.map((skill) => (
              <ProgressBar key={skill.label} {...skill} />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-950">Improvement journey</h2>
            <span className="text-sm font-semibold text-teal-700">+28 points</span>
          </div>
          <div className="mt-5 flex h-48 items-end gap-3">
            {journey.map((score, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end rounded-md bg-slate-50">
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-blue-600 to-teal-500"
                    style={{ height: `${score}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500">S{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
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
            {recentInterviews.map((item) => (
              <div key={`${item.role}-${item.date}`} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-semibold text-slate-950">{item.role}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.type} - {item.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-white px-3 py-1 text-sm font-semibold text-slate-950">
                      {item.score}/10
                    </span>
                    <span className="text-sm text-slate-500">{item.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Roles and industries</h2>
          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-500">Recommended roles</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {recommendedRoles.map((role) => (
                <span key={role} className="rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                  {role}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-500">Industries to practice</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {industries.map((industry) => (
                <span key={industry} className="rounded-md bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700">
                  {industry}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3 rounded-lg bg-indigo-50 p-4 text-sm text-indigo-900">
            <CalendarCheck2 size={19} aria-hidden="true" />
            <span>Next scheduled practice: July 10, 2026 at 5:30 PM.</span>
          </div>
        </div>
      </section>
    </PracticeShell>
  );
}
