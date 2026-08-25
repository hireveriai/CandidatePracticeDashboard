import { Check, MessageSquareQuote, X } from "lucide-react";
import type { Suggestion } from "./types";

const SOURCE_LABEL: Record<Suggestion["source"], string> = {
  resume: "From your resume",
  interview: "From your interview",
  both: "From your resume + interview",
};

const SOURCE_TONE: Record<Suggestion["source"], string> = {
  resume: "bg-slate-100 text-slate-700",
  interview: "bg-indigo-50 text-indigo-700",
  both: "bg-teal-50 text-teal-700",
};

function fieldLabel(fieldPath: string) {
  if (fieldPath === "summary") return "Professional Summary";
  if (fieldPath === "skills") return "Skills";
  if (fieldPath === "certifications") return "Certifications";
  if (fieldPath === "projects") return "Projects";
  const experienceMatch = fieldPath.match(/^experience\[(\d+)\]/);
  if (experienceMatch) return `Experience entry ${Number(experienceMatch[1]) + 1}`;
  return fieldPath;
}

export default function SuggestionCard({
  suggestion,
  onDecide,
  busy,
}: {
  suggestion: Suggestion;
  onDecide: (decision: "accepted" | "rejected") => void;
  busy: boolean;
}) {
  const decided = suggestion.decision !== "pending";

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm transition ${
        suggestion.decision === "accepted"
          ? "border-emerald-200 bg-emerald-50/50"
          : suggestion.decision === "rejected"
            ? "border-slate-200 bg-slate-50 opacity-60"
            : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-950">{fieldLabel(suggestion.fieldPath)}</p>
        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${SOURCE_TONE[suggestion.source]}`}>
          {SOURCE_LABEL[suggestion.source]}
        </span>
      </div>

      {suggestion.currentText ? (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current</p>
          <p className="mt-1 text-sm leading-6 text-slate-500 line-through decoration-slate-300">{suggestion.currentText}</p>
        </div>
      ) : null}

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">VERIS Suggestion</p>
        <p className="mt-1 text-sm leading-6 text-slate-800">{suggestion.suggestedText}</p>
      </div>

      {suggestion.evidence ? (
        <div className="mt-3 flex gap-2 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          <MessageSquareQuote size={14} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span>{suggestion.evidence}</span>
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onDecide("accepted")}
          className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            suggestion.decision === "accepted"
              ? "bg-emerald-600 text-white"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
          }`}
        >
          <Check size={14} aria-hidden="true" />
          Accept
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onDecide("rejected")}
          className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            suggestion.decision === "rejected"
              ? "bg-slate-700 text-white"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <X size={14} aria-hidden="true" />
          {suggestion.source === "interview" ? "Don't Add" : "Reject"}
        </button>
        {decided ? (
          <span className="text-xs font-medium text-slate-400">
            {suggestion.decision === "accepted" ? "Will be included" : "Won't be included"}
          </span>
        ) : null}
      </div>
    </div>
  );
}
