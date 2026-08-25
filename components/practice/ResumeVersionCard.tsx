"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, Sparkles, Wand2 } from "lucide-react";
import type { CandidateResumeRow } from "@/lib/server/resume/resume-store";

const TYPE_LABEL: Record<CandidateResumeRow["enhancementType"], string> = {
  original: "Original",
  ai_enhancement: "VERIS AI Enhanced",
  interview_enhancement: "VERIS + Interview Enhanced",
};

const TYPE_ICON = {
  original: FileText,
  ai_enhancement: Sparkles,
  interview_enhancement: Wand2,
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function ResumeVersionCard({ resume, indent }: { resume: CandidateResumeRow; indent: boolean }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const Icon = TYPE_ICON[resume.enhancementType];

  async function useAsCurrent() {
    if (updating || resume.isCurrent) return;
    setUpdating(true);
    try {
      const response = await fetch("/api/practice/resume/set-current", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: resume.resumeId }),
      });
      if (response.ok) {
        router.refresh();
      }
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-4 transition sm:flex-row sm:items-center sm:justify-between ${
        resume.isCurrent ? "border-blue-200 bg-blue-50/60" : "border-slate-100 bg-slate-50"
      } ${indent ? "ml-6" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
          <Icon size={16} aria-hidden="true" />
        </span>
        <div>
          <p className="flex items-center gap-2 font-semibold text-slate-950">
            {TYPE_LABEL[resume.enhancementType]}
            {resume.isCurrent ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                <CheckCircle2 size={12} aria-hidden="true" />
                Current
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-sm text-slate-500">Created {formatDate(resume.createdAt)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!resume.isCurrent ? (
          <button
            type="button"
            onClick={useAsCurrent}
            disabled={updating}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updating ? "Updating…" : "Use as current"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
