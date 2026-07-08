import Link from "next/link";
import { ArrowRight, CreditCard } from "lucide-react";
import type { PracticePricingData, PracticePlan } from "@/lib/server/practice-pricing";

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getCheckoutHref(plan: PracticePlan) {
  const base =
    process.env.NEXT_PUBLIC_PRACTICE_CANDIDATE_CHECKOUT_URL ||
    process.env.NEXT_PUBLIC_LANDING_PRICING_URL ||
    "https://hireveri.com/pricing";
  const url = new URL(base);
  url.searchParams.set("plan", plan.slug);
  url.searchParams.set("audience", "practice-candidate");
  return url.toString();
}

export default function PracticePricing({ pricing }: { pricing: PracticePricingData }) {
  const subscription = pricing.subscription;

  return (
    <section className="mt-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Practice pricing</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            VERIS practice interview plans
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Plans are loaded from HireVeri billing records. Practice candidates use paid interview credits only; no trial credits are created.
          </p>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm">
          <p className="font-semibold text-slate-950">
            {subscription ? subscription.planName : "No active plan"}
          </p>
          <p className="mt-1 text-slate-600">
            {subscription
              ? `${subscription.remainingCredits} practice credits remaining`
              : "Choose a plan to activate practice credits."}
          </p>
        </div>
      </div>

      {pricing.plans.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pricing.plans.map((plan, index) => (
            <article
              key={plan.id}
              className={`flex h-full flex-col rounded-lg border p-5 transition hover:-translate-y-0.5 ${
                index === 1
                  ? "border-blue-300 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-950">{plan.name}</p>
                  <p className="mt-2 min-h-16 text-sm leading-6 text-slate-600">{plan.description}</p>
                </div>
                {index === 1 ? (
                  <span className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white">
                    Popular
                  </span>
                ) : null}
              </div>

              <p className="mt-5 text-3xl font-semibold text-slate-950">{formatINR(plan.price)}</p>
              <p className="mt-1 text-sm font-semibold text-blue-700">
                {plan.interviewLimit} practice {plan.interviewLimit === 1 ? "interview" : "interviews"}
              </p>

              <div className="mt-5 flex-1 space-y-2 text-sm text-slate-600">
                {plan.features.slice(0, 6).map((feature) => (
                  <div key={feature} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href={getCheckoutHref(plan)}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <CreditCard size={16} aria-hidden="true" />
                Choose plan
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          No active practice candidate plans found in hireveri_plans.
        </div>
      )}
    </section>
  );
}
