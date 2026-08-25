"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Gift, Info, X } from "lucide-react";
import type { PracticeEntitlementState } from "@/lib/server/practice-entitlement";

type Props = {
  entitlement: PracticeEntitlementState;
  hasPaidCredits: boolean;
};

type FormValues = {
  fullName: string;
  phone: string;
  currentRole: string;
  message: string;
};

const EMPTY_FORM: FormValues = { fullName: "", phone: "", currentRole: "", message: "" };

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
    <section className={`mt-5 rounded-xl border p-6 shadow-sm ${toneClass}`}>
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

function RequestFormModal({
  values,
  onChange,
  onClose,
  onSubmit,
  submitting,
  error,
}: {
  values: FormValues;
  onChange: (values: FormValues) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Request Free Practice Interview</h3>
            <p className="mt-1 text-sm text-slate-600">
              Tell us a bit about yourself so our team can review your request quickly.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="mt-5 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Full name</span>
            <input
              type="text"
              required
              value={values.fullName}
              onChange={(event) => onChange({ ...values, fullName: event.target.value })}
              className="h-11 rounded-md border border-slate-200 px-3 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="Your full name"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Phone number</span>
            <input
              type="tel"
              required
              value={values.phone}
              onChange={(event) => onChange({ ...values, phone: event.target.value })}
              className="h-11 rounded-md border border-slate-200 px-3 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="+91 98765 43210"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Role you&rsquo;re preparing for</span>
            <input
              type="text"
              required
              value={values.currentRole}
              onChange={(event) => onChange({ ...values, currentRole: event.target.value })}
              className="h-11 rounded-md border border-slate-200 px-3 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="e.g. Product Manager"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Anything else we should know? (optional)</span>
            <textarea
              value={values.message}
              onChange={(event) => onChange({ ...values, message: event.target.value })}
              rows={3}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="Interview date, target company, anything you'd like us to know"
            />
          </label>

          {error ? <p className="text-sm text-amber-700">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 inline-flex min-h-11 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
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
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>(EMPTY_FORM);

  const request = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/practice/entitlement", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        setError(payload?.message || "We couldn't submit your request. Please try again.");
        return;
      }

      setState(payload.entitlement);
      setFormOpen(false);
      setFormValues(EMPTY_FORM);
    } catch (requestError) {
      console.warn("Free practice request failed", requestError);
      setError("We couldn't submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [submitting, formValues]);

  if (state.status === "PENDING_REVIEW") {
    return (
      <Shell tone="info" icon={<Clock3 size={20} aria-hidden="true" />} title="Free Practice Request Under Review">
        <p className="mt-2 text-sm leading-6 text-slate-700">
          We&rsquo;re reviewing your request. Your free practice interview will be ready — and visible on this
          dashboard — as soon as it&rsquo;s approved.
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
    <>
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
          onClick={() => setFormOpen(true)}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Request Free Practice
        </button>
        {error ? <p className="mt-3 text-sm text-amber-700">{error}</p> : null}
      </Shell>

      {formOpen && (
        <RequestFormModal
          values={formValues}
          onChange={setFormValues}
          onClose={() => setFormOpen(false)}
          onSubmit={request}
          submitting={submitting}
          error={error}
        />
      )}
    </>
  );
}
