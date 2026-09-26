import type { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* Fixed-height label row: a label that wraps to two lines must not push
          its value lower than the neighbouring cards. */}
      <div className="flex h-9 items-center justify-between gap-3">
        <p className="line-clamp-2 text-sm font-medium leading-tight text-slate-500">{label}</p>
        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
            <Icon size={17} aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm font-medium text-teal-700">{detail}</p>
    </div>
  );
}
