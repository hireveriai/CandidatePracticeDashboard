"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Gift, Info } from "lucide-react";
import type { PracticeEntitlementState } from "@/lib/server/practice-entitlement";

type Props = {
  entitlement: PracticeEntitlementState;
  hasPaidCredits: boolean;
};

function Shell({
  tone,
  icon,
  title,
  children,
}: {
  tone: "brand" | "info" | "muted" | "success";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const toneClass = {
    brand: "border-blue-200 bg-blue-50",
    info: "border-amber-200 bg-amber-50",
    muted: "border-slate-200 bg-white",
    success: "border-emerald-200 bg-emerald-50",
  }[tone];

  return (
    <section className={`mt-5 rounded-lg border p-6 shadow-sm ${toneClass}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-slate-700">{icon}</span>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          {children}
        </div>
      </div>
    </section>
  );
}

/**
 * The candidate-side free-practice lifecycle.
 *
 * The free interview is never shown as available before it has actually been
 * granted; the API refuses to start one regardless of what this renders.
 */
export default function FreePracticeCard({ entitlement, hasPaidCredits }: Props) {
  const [state, setState] = useState(entitlement);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/practice/entitlement", {
        method: "POST",
        credentials: "include",
      });
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        setError(payload?.message || "We couldn't submit your request. Please try again.");
        return;
      }

      setState(payload.entitlement);
    } catch (requestError) {
      console.warn("Free practice request failed", requestError);
      setError("We couldn't submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [submitting]);

  if (state.status === "PENDING_REVIEW") {
    return (
      <Shell tone="info" icon={<Clock3 size={20} aria-hidden="true" />} title="Free Practice Request Under Review">
        <p className="mt-2 text-sm leading-6 text-slate-700">
          We&rsquo;re running a quick eligibility check. Your free practice interview will be ready once your request
          is approved.
        </p>
        <p className="mt-3 text-sm font-medium text-amber-800">Usually reviewed within 24 hours.</p>
      </Shell>
    );
  }

  if (state.status === "APPROVED" && state.freeCreditsRemaining > 0) {
    return (
      <Shell tone="success" icon={<CheckCircle2 size={20} aria-hidden="true" />} title="Free Practice Interview Ready">
        <p className="mt-2 text-sm leading-6 text-slate-700">
          You have {state.freeCreditsRemaining} free VERIS AI practice interview with personalized feedback.
        </p>
        <Link
          href="/interview/setup?mode=practice"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          Start Free Practice Interview
        </Link>
      </Shell>
    );
  }

  if (state.consumed) {
    return (
      <Shell tone="muted" icon={<Info size={20} aria-hidden="true" />} title="Free Practice Interview Used">
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {hasPaidCredits
            ? "You've used your free practice interview. Your paid credits are ready whenever you are."
            : "You've used your free practice interview. Choose a practice plan below to keep going."}
        </p>
      </Shell>
    );
  }

  if (state.status === "REJECTED") {
    return (
      <Shell tone="muted" icon={<Info size={20} aria-hidden="true" />} title="Free Practice Not Available">
        <p className="mt-2 text-sm leading-6 text-slate-700">
          We weren&rsquo;t able to approve a free practice interview for this account. You can still choose a practice
          plan below, or contact support if you think this is a mistake.
        </p>
      </Shell>
    );
  }

  return (
    <Shell tone="brand" icon={<Gift size={20} aria-hidden="true" />} title="Request Your Free Practice Interview">
      <p className="mt-2 text-sm leading-6 text-slate-700">
        Get one free VERIS AI practice interview with personalized feedback.
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
        <li>No credit card required</li>
        <li>Usually reviewed within 24 hours</li>
      </ul>
      <button
        type="button"
        onClick={request}
        disabled={submitting}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Request Free Practice"}
      </button>
      {error ? <p className="mt-3 text-sm text-amber-700">{error}</p> : null}
    </Shell>
  );
}
