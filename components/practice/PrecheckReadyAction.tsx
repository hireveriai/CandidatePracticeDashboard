"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PrecheckReadyAction({
  link,
  token,
  interviewId,
}: {
  link?: string;
  token?: string;
  interviewId?: string;
}) {
  if (!link) {
    return (
      <Link
        href="/interview/setup"
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        Create interview first
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <div className="mt-6">
      <a
        href={link}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        I am ready
        <ArrowRight size={18} aria-hidden="true" />
      </a>
      <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
        Interview {interviewId ?? "created"} {token ? `- token ${token.slice(0, 8)}...` : ""}
      </div>
    </div>
  );
}
