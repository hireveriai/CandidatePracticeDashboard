import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const highlights = [
  "Coach-like AI feedback after every session",
  "Mock interviews for behavioral, technical, and coding rounds",
  "Progress reports, resume practice, and career insights",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fbff] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8">
        <nav className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Link href="/" className="flex items-center gap-3" aria-label="HireVeri home">
            <Image
              src="/hireveri_logo.png"
              alt="HireVeri"
              width={128}
              height={34}
              priority
              className="h-8 w-auto"
            />
            <span className="hidden border-l border-slate-200 pl-3 text-sm font-medium text-slate-600 sm:inline">
              Practice Candidate
            </span>
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Open practice
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">
              <Sparkles size={16} aria-hidden="true" />
              Premium AI interview preparation
            </div>

            <h1 className="text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              HireVeri Practice Candidate
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Practice realistic interviews, receive calm coaching, track your
              improvement, and walk into hiring conversations with sharper
              answers.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/interview/setup?mode=practice"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Start mock interview
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-base font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                View dashboard
              </Link>
            </div>

            <div className="mt-8 grid gap-3">
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-3 text-slate-700">
                  <CheckCircle2 className="text-teal-600" size={19} aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70">
            <div className="rounded-md bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                  <BrainCircuit className="text-blue-600" size={24} aria-hidden="true" />
                  <p className="mt-5 text-sm text-slate-500">AI coach readiness</p>
                  <p className="mt-1 text-3xl font-semibold text-slate-950">86%</p>
                </div>
                <div className="rounded-lg border border-indigo-100 bg-white p-5 shadow-sm">
                  <BarChart3 className="text-indigo-600" size={24} aria-hidden="true" />
                  <p className="mt-5 text-sm text-slate-500">Growth this month</p>
                  <p className="mt-1 text-3xl font-semibold text-slate-950">+18%</p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Recommended session
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Product Manager - behavioral and case round
                    </p>
                  </div>
                  <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-teal-700">
                    30 min
                  </span>
                </div>
                <div className="mt-5 h-2 rounded-full bg-slate-100">
                  <div className="h-2 w-[72%] rounded-full bg-blue-600" />
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Your next practice focuses on concise STAR answers and stronger follow-ups.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
