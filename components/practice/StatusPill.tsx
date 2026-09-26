// Interview statuses and types arrive as raw database values ("IN_PROGRESS",
// "completed", "PRACTICE"); these helpers turn them into candidate-facing text.

const STATUS_TONES: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  complete: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  evaluated: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  finished: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  in_progress: "bg-blue-50 text-blue-700 ring-blue-200",
  active: "bg-blue-50 text-blue-700 ring-blue-200",
  ready: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  pending: "bg-slate-100 text-slate-600 ring-slate-200",
  expired: "bg-amber-50 text-amber-700 ring-amber-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
  failed: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function formatLabel(value: string | null | undefined, fallback: string) {
  const text = value?.trim();
  if (!text) return fallback;
  const words = text.replace(/[_-]+/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default function StatusPill({ status }: { status: string | null }) {
  const key = (status ?? "pending").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const tone = STATUS_TONES[key] ?? STATUS_TONES.pending;

  return (
    <span className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone}`}>
      {formatLabel(status, "Pending")}
    </span>
  );
}
