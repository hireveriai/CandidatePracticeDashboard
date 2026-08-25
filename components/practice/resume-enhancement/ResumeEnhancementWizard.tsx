"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Crown,
  Download,
  FileText,
  Loader2,
  Lock,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import ResumePreview from "./ResumePreview";
import SuggestionCard from "./SuggestionCard";
import type {
  EligibleInterview,
  EnhancementMode,
  PricingTier,
  ResumeListItem,
  ResumeTemplate,
  StructuredResume,
  Suggestion,
} from "./types";
import { CURRENCY_SYMBOL } from "./types";

type RazorpayInstance = { open: () => void; on: (event: string, handler: (response: unknown) => void) => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type Step = "method" | "resume" | "interview" | "processing" | "review" | "generating" | "template" | "checkout";

const AI_ONLY_PROGRESS = ["Analyzing your resume...", "Reviewing wording and structure...", "Preparing enhancement suggestions..."];
const INTERVIEW_PROGRESS = [
  "Analyzing your resume...",
  "Reviewing your practice interview...",
  "Comparing interview insights against your resume...",
  "Preparing enhancement suggestions...",
];

function formatDate(value: string | null) {
  if (!value) return "Unknown date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

function resumeLabel(resume: ResumeListItem) {
  if (resume.enhancementType === "ai_enhancement") return "VERIS AI Enhanced";
  if (resume.enhancementType === "interview_enhancement") return "VERIS + Interview Enhanced";
  return resume.structuredData.candidate.fullName ? `${resume.structuredData.candidate.fullName}'s resume` : "Resume";
}

export default function ResumeEnhancementWizard() {
  const [step, setStep] = useState<Step>("method");
  const [loadingContext, setLoadingContext] = useState(true);
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [interviews, setInterviews] = useState<EligibleInterview[]>([]);

  const [mode, setMode] = useState<EnhancementMode | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  const [progressIndex, setProgressIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionBusyId, setSuggestionBusyId] = useState<string | null>(null);

  const [finalResume, setFinalResume] = useState<StructuredResume | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);

  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [templatePricing, setTemplatePricing] = useState<{ currency: string; standard: number; premium: number } | null>(
    null
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const [exportId, setExportId] = useState<string | null>(null);
  const [price, setPrice] = useState<{ amountMinor: number; currency: string } | null>(null);
  const [preparingExport, setPreparingExport] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paying, setPaying] = useState(false);

  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        const [resumeRes, interviewRes, templateRes] = await Promise.all([
          fetch("/api/practice/resume/list", { credentials: "include" }),
          fetch("/api/practice/interviews/eligible", { credentials: "include" }),
          fetch("/api/practice/resume/templates", { credentials: "include" }),
        ]);
        const resumePayload = await resumeRes.json();
        const interviewPayload = await interviewRes.json();
        const templatePayload = await templateRes.json();

        if (cancelled) return;

        if (resumePayload?.ok) setResumes(resumePayload.resumes ?? []);
        if (interviewPayload?.ok) setInterviews(interviewPayload.interviews ?? []);
        if (templatePayload?.ok) {
          setTemplates(templatePayload.templates ?? []);
          setTemplatePricing(templatePayload.pricing ?? null);
        }
      } finally {
        if (!cancelled) setLoadingContext(false);
      }
    }

    void loadContext();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentResume = resumes.find((resume) => resume.isCurrent) ?? resumes[0] ?? null;
  const eligibleInterviews = interviews.filter((interview) => interview.hasTranscript && interview.hasReport);

  function startProgress(mode: EnhancementMode) {
    const messages = mode === "ai_enhancement" ? AI_ONLY_PROGRESS : INTERVIEW_PROGRESS;
    setProgressIndex(0);
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      setProgressIndex((index) => Math.min(index + 1, messages.length - 1));
    }, 2200);
  }

  function stopProgress() {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  }

  useEffect(() => stopProgress, []);

  function chooseMode(nextMode: EnhancementMode) {
    setMode(nextMode);
    setError(null);
    if (!selectedResumeId && currentResume) setSelectedResumeId(currentResume.resumeId);
    setStep("resume");
  }

  function confirmResume() {
    if (!selectedResumeId) return;
    if (mode === "interview_enhancement") {
      setStep("interview");
    } else {
      void runEnhancement();
    }
  }

  async function runEnhancement(forceRegenerate = false) {
    if (!mode || !selectedResumeId) return;
    if (mode === "interview_enhancement" && !selectedAttemptId) return;

    setStep("processing");
    setError(null);
    startProgress(mode);

    try {
      const response = await fetch("/api/practice/resume/enhance", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceResumeId: selectedResumeId,
          mode,
          interviewAttemptId: mode === "interview_enhancement" ? selectedAttemptId : undefined,
          forceRegenerate,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        setError(payload?.message || "We couldn't analyze this resume. Please try again.");
        setStep(mode === "interview_enhancement" ? "interview" : "resume");
        return;
      }

      setSessionId(payload.session.sessionId);
      setSuggestions(payload.suggestions ?? []);
      setStep("review");
    } catch (requestError) {
      console.warn("Enhancement request failed", requestError);
      setError("We couldn't analyze this resume. Please try again.");
      setStep(mode === "interview_enhancement" ? "interview" : "resume");
    } finally {
      stopProgress();
    }
  }

  async function decideSuggestion(suggestionId: string, decision: "accepted" | "rejected") {
    if (!sessionId) return;
    setSuggestionBusyId(suggestionId);
    setSuggestions((current) =>
      current.map((item) => (item.suggestionId === suggestionId ? { ...item, decision } : item))
    );

    try {
      await fetch("/api/practice/resume/suggestion", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, suggestionId, decision }),
      });
    } finally {
      setSuggestionBusyId(null);
    }
  }

  async function decideAll(decision: "accepted" | "rejected") {
    if (!sessionId) return;
    setSuggestions((current) => current.map((item) => ({ ...item, decision })));
    await fetch("/api/practice/resume/suggestion", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, applyToAll: true, decision }),
    });
  }

  async function generateResume() {
    if (!sessionId) return;
    setStep("generating");
    setError(null);

    try {
      const response = await fetch("/api/practice/resume/approve", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        setError(payload?.message || "We couldn't generate your resume. Please try again.");
        setStep("review");
        return;
      }

      setFinalResume(payload.resume);
      setResumeId(payload.resumeId);
      setExportId(null);
      setPrice(null);
      setPaid(false);
      const firstStandard = templates.find((template) => template.tier === "standard");
      setSelectedTemplateId(firstStandard?.id ?? null);
      setStep("template");
    } catch (requestError) {
      console.warn("Resume generation failed", requestError);
      setError("We couldn't generate your resume. Please try again.");
      setStep("review");
    }
  }

  async function prepareExport(): Promise<{ exportId: string; alreadyPaid: boolean } | null> {
    if (!resumeId || !sessionId || !selectedTemplateId) return null;
    setPreparingExport(true);
    setError(null);

    try {
      const response = await fetch("/api/practice/resume/export/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, sessionId, templateId: selectedTemplateId }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        setError(payload?.message || "We couldn't prepare your resume files. Please try again.");
        return null;
      }

      setExportId(payload.exportId);
      setPrice(payload.price);
      setPaid(Boolean(payload.alreadyPaid));
      return { exportId: payload.exportId, alreadyPaid: Boolean(payload.alreadyPaid) };
    } catch (requestError) {
      console.warn("Export preparation failed", requestError);
      setError("We couldn't prepare your resume files. Please try again.");
      return null;
    } finally {
      setPreparingExport(false);
    }
  }

  async function unlockDownload() {
    if (paying) return;
    setPaying(true);
    setError(null);

    try {
      const prepared = await prepareExport();
      if (!prepared) {
        setPaying(false);
        return;
      }

      if (prepared.alreadyPaid) {
        setPaid(true);
        setPaying(false);
        setStep("checkout");
        return;
      }

      setStep("checkout");

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        setError("Could not load the secure checkout. Please try again.");
        setPaying(false);
        return;
      }

      const orderRes = await fetch("/api/practice/resume/export/create-order", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exportId: prepared.exportId }),
      });
      const orderPayload = await orderRes.json();

      if (!orderRes.ok || !orderPayload?.ok) {
        setError(orderPayload?.message || "Could not start checkout. Please try again.");
        setPaying(false);
        return;
      }

      if (orderPayload.alreadyPaid) {
        setPaid(true);
        setPaying(false);
        return;
      }

      const checkout = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderPayload.amount,
        currency: orderPayload.currency,
        name: "VerisNova",
        description: "VERIS Enhanced Resume (PDF + DOCX)",
        order_id: orderPayload.orderId,
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: () => setPaying(false),
        },
        handler: async (response: unknown) => {
          const r = response as { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
          try {
            const verifyRes = await fetch("/api/practice/resume/export/verify", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                exportId: prepared.exportId,
                razorpay_order_id: r.razorpay_order_id,
                razorpay_payment_id: r.razorpay_payment_id,
                razorpay_signature: r.razorpay_signature,
              }),
            });
            const verifyPayload = await verifyRes.json();
            if (verifyRes.ok && verifyPayload?.ok) {
              setPaid(true);
            } else {
              setError(verifyPayload?.message || "Payment could not be verified.");
            }
          } finally {
            setPaying(false);
          }
        },
      });

      checkout.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setPaying(false);
      });

      checkout.open();
    } catch (checkoutError) {
      console.warn("Checkout failed", checkoutError);
      setError("Could not start checkout. Please try again.");
      setPaying(false);
    }
  }

  async function downloadFile(format: "pdf" | "docx") {
    if (!exportId) return;
    const response = await fetch(`/api/practice/resume/export/download?exportId=${exportId}&format=${format}`, {
      credentials: "include",
    });
    const payload = await response.json();
    if (response.ok && payload?.ok && payload.url) {
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } else {
      setError(payload?.message || "Could not prepare your download.");
    }
  }

  const progressMessages = mode === "interview_enhancement" ? INTERVIEW_PROGRESS : AI_ONLY_PROGRESS;
  const acceptedCount = suggestions.filter((item) => item.decision === "accepted").length;
  const currencySymbol = price ? CURRENCY_SYMBOL[price.currency] ?? "" : "";
  const priceLabel = price ? `${currencySymbol}${(price.amountMinor / 100).toFixed(2)}` : "";

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null;
  const standardTemplates = templates.filter((template) => template.tier === "standard");
  const premiumTemplates = templates.filter((template) => template.tier === "premium");

  function formatTierPrice(tier: PricingTier) {
    if (!templatePricing) return "";
    const symbol = CURRENCY_SYMBOL[templatePricing.currency] ?? "";
    const amount = tier === "standard" ? templatePricing.standard : templatePricing.premium;
    return `${symbol}${(amount / 100).toFixed(2)}`;
  }

  if (loadingContext) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-16">
        <Loader2 className="animate-spin text-blue-600" size={22} aria-hidden="true" />
      </div>
    );
  }

  if (!resumes.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <FileText size={26} aria-hidden="true" />
        </span>
        <h2 className="text-lg font-semibold text-slate-950">Upload a resume to get started</h2>
        <p className="max-w-md text-sm leading-6 text-slate-600">
          Resume Enhancement works from a resume already in your Resume Library.
        </p>
        <Link
          href="/resume-library"
          className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Go to Resume Library
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">{error}</div>
      ) : null}

      {step === "method" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => chooseMode("ai_enhancement")}
            className="flex flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Sparkles size={20} aria-hidden="true" />
            </span>
            <p className="text-lg font-semibold text-slate-950">Enhance with VERIS AI</p>
            <p className="text-sm leading-6 text-slate-600">
              Improve your resume using AI-powered analysis of your existing resume.
            </p>
          </button>

          <button
            type="button"
            disabled={!eligibleInterviews.length}
            onClick={() => chooseMode("interview_enhancement")}
            className="flex flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:border-slate-200 disabled:hover:shadow-sm"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Target size={20} aria-hidden="true" />
            </span>
            <p className="text-lg font-semibold text-slate-950">Enhance Using Interview Insights</p>
            <p className="text-sm leading-6 text-slate-600">
              Use your previous VERIS interview session to identify relevant experience and achievements that may
              be missing from your resume.
            </p>
            {!eligibleInterviews.length ? (
              <p className="text-xs font-semibold text-amber-700">
                Complete a VERIS practice interview to unlock Interview Insights.
              </p>
            ) : null}
          </button>
        </div>
      )}

      {step === "resume" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Select a resume</h2>
            <button type="button" onClick={() => setStep("method")} className="text-sm font-semibold text-slate-500 hover:text-slate-700">
              <ArrowLeft size={14} className="mr-1 inline" aria-hidden="true" />
              Back
            </button>
          </div>
          <div className="mt-4 grid gap-2">
            {resumes.map((resume) => (
              <button
                key={resume.resumeId}
                type="button"
                onClick={() => setSelectedResumeId(resume.resumeId)}
                className={`flex items-center justify-between gap-3 rounded-lg border p-4 text-left transition ${
                  selectedResumeId === resume.resumeId
                    ? "border-blue-300 bg-blue-50/60"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div>
                  <p className="font-semibold text-slate-950">{resumeLabel(resume)}</p>
                  <p className="mt-0.5 text-sm text-slate-500">Uploaded {formatDate(resume.createdAt)}</p>
                </div>
                {selectedResumeId === resume.resumeId ? (
                  <CheckCircle2 size={20} className="shrink-0 text-blue-600" aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!selectedResumeId}
            onClick={confirmResume}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {step === "interview" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Select a practice interview</h2>
            <button type="button" onClick={() => setStep("resume")} className="text-sm font-semibold text-slate-500 hover:text-slate-700">
              <ArrowLeft size={14} className="mr-1 inline" aria-hidden="true" />
              Back
            </button>
          </div>
          <div className="mt-4 grid gap-2">
            {eligibleInterviews.map((interview) => (
              <button
                key={interview.attemptId}
                type="button"
                onClick={() => setSelectedAttemptId(interview.attemptId)}
                className={`flex flex-col gap-1 rounded-lg border p-4 text-left transition sm:flex-row sm:items-center sm:justify-between ${
                  selectedAttemptId === interview.attemptId
                    ? "border-blue-300 bg-blue-50/60"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div>
                  <p className="font-semibold text-slate-950">{interview.jobTitle ?? "Practice interview"}</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {formatDate(interview.interviewDate)}
                    {formatDuration(interview.durationSeconds) ? ` · ${formatDuration(interview.durationSeconds)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {interview.overallScore !== null ? (
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      Score: {interview.overallScore}
                    </span>
                  ) : null}
                  {selectedAttemptId === interview.attemptId ? (
                    <CheckCircle2 size={20} className="shrink-0 text-blue-600" aria-hidden="true" />
                  ) : null}
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!selectedAttemptId}
            onClick={() => void runEnhancement()}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Analyze with VERIS
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {(step === "processing" || step === "generating") && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <Loader2 className="animate-spin text-blue-600" size={28} aria-hidden="true" />
          <p className="text-sm font-medium text-slate-700">
            {step === "generating" ? "Generating your resume..." : progressMessages[progressIndex]}
          </p>
        </div>
      )}

      {step === "review" && (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">VERIS Enhancement Suggestions</h2>
              <p className="mt-1 text-sm text-slate-500">
                {suggestions.length} suggestion{suggestions.length === 1 ? "" : "s"} · {acceptedCount} accepted
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void decideAll("accepted")}
                className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Accept All
              </button>
            </div>
          </div>

          {suggestions.length ? (
            <div className="grid gap-3">
              {suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.suggestionId}
                  suggestion={suggestion}
                  busy={suggestionBusyId === suggestion.suggestionId}
                  onDecide={(decision) => void decideSuggestion(suggestion.suggestionId, decision)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
              VERIS didn&rsquo;t find any changes worth suggesting for this resume right now.
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void generateResume()}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Generate Enhanced Resume
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {step === "template" && finalResume && (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Choose Your Resume Style</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Your interview can tell a stronger story than your resume currently does. VERIS has brought that
                real experience into the resume below -- now pick how it looks.
              </p>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Standard templates -- included in Standard Export
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {standardTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    selected={selectedTemplateId === template.id}
                    onSelect={() => setSelectedTemplateId(template.id)}
                  />
                ))}
              </div>

              <p className="mt-5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Crown size={13} className="text-amber-500" aria-hidden="true" />
                Premium templates -- included in Premium Export
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {premiumTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    selected={selectedTemplateId === template.id}
                    onSelect={() => setSelectedTemplateId(template.id)}
                  />
                ))}
              </div>
            </div>

            <ResumePreview
              resume={finalResume}
              accent={selectedTemplate?.accent}
              layout={selectedTemplate?.layout}
            />
          </div>

          <aside className="h-fit rounded-xl border border-blue-100 bg-blue-50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Wand2 size={16} aria-hidden="true" />
              {selectedTemplate?.tier === "premium" ? "Premium Export" : "Standard Export"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{selectedTemplate?.description}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">
              {selectedTemplate ? formatTierPrice(selectedTemplate.tier) : ""}
            </p>
            <ul className="mt-3 grid gap-1.5 text-sm text-slate-600">
              <li>VERIS AI enhancement + Interview Insights</li>
              <li>{selectedTemplate?.tier === "premium" ? "Premium template design" : "Standard, ATS-friendly template"}</li>
              <li>PDF export</li>
              <li>DOCX export</li>
            </ul>
            <button
              type="button"
              onClick={() => void unlockDownload()}
              disabled={!selectedTemplateId || preparingExport || paying}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {preparingExport || paying ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <Lock size={16} aria-hidden="true" />
              )}
              {selectedTemplate?.tier === "premium"
                ? `Unlock Premium — ${formatTierPrice("premium")}`
                : `Standard Export — ${formatTierPrice("standard")}`}
            </button>
            <p className="mt-2 text-center text-xs text-slate-500">One purchase unlocks both PDF and DOCX.</p>
          </aside>
        </div>
      )}

      {step === "checkout" && finalResume && (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <ResumePreview resume={finalResume} accent={selectedTemplate?.accent} layout={selectedTemplate?.layout} />

          <aside className="h-fit rounded-xl border border-blue-100 bg-blue-50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Wand2 size={16} aria-hidden="true" />
              {paid ? "Your enhanced resume is ready" : "Complete your purchase"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {paid
                ? "This version has been saved to your Resume Library."
                : "A secure Razorpay checkout window should have opened. Complete payment there to unlock your download."}
            </p>

            {!paid ? (
              <button
                type="button"
                onClick={() => void unlockDownload()}
                disabled={paying}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paying ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
                {`${selectedTemplate?.tier === "premium" ? "Unlock Premium" : "Standard Export"} — ${priceLabel}`}
              </button>
            ) : (
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => void downloadFile("pdf")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Download size={16} aria-hidden="true" />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => void downloadFile("docx")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  <Download size={16} aria-hidden="true" />
                  Download DOCX
                </button>
                <p className="text-center text-xs text-slate-500">One purchase unlocks both formats.</p>
              </div>
            )}
            {!paid ? (
              <button
                type="button"
                onClick={() => setStep("template")}
                className="mt-3 w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft size={12} className="mr-1 inline" aria-hidden="true" />
                Change template
              </button>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: ResumeTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition ${
        selected ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <span className="h-2 w-8 rounded-full" style={{ backgroundColor: `#${template.accent}` }} aria-hidden="true" />
        {template.tier === "premium" ? <Crown size={13} className="text-amber-500" aria-hidden="true" /> : null}
      </div>
      <p className="text-sm font-semibold text-slate-950">{template.name}</p>
      <p className="text-xs leading-5 text-slate-500">{template.description}</p>
    </button>
  );
}
