"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PrecheckReadyAction({ link }: { link?: string }) {
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
    <a
      href={link}
      className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
    >
      I am ready
      <ArrowRight size={18} aria-hidden="true" />
    </a>
  );
}
