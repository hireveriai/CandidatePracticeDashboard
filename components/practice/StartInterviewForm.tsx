"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Code2, Loader2, Mic, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { setupOptions } from "@/components/practice/data";

type FormState = {
  role: string;
  experience: string;
  difficulty: string;
  interviewType: string;
  language: string;
  duration: string;
  coding: boolean;
};

const identityStorageKey = "hireveri.practice.identityId";

function getPracticeIdentityId() {
  const existing = window.localStorage.getItem(identityStorageKey);
  if (existing) {
    return existing;
  }

  const created = window.crypto.randomUUID();
  window.localStorage.setItem(identityStorageKey, created);
  return created;
}

export default function StartInterviewForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>({
    role: "",
    experience: setupOptions.experience[1],
    difficulty: setupOptions.difficulty[1],
    interviewType: setupOptions.types[3],
    language: setupOptions.languages[0],
    duration: setupOptions.durations[1],
    coding: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sequence = useMemo(
    () => [
      { icon: Video, text: "Camera and environment check" },
      { icon: Mic, text: "Microphone and voice clarity check" },
      { icon: ArrowRight, text: "Ready screen before Veris interview" },
      { icon: Code2, text: state.coding ? "Coding round enabled" : "Coding round optional" },
    ],
    [state.coding]
  );

  async function startInterview() {
    const role = state.role.trim();
    if (!role) {
      setError("Enter the role you want to practice for.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/practice/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identityId: getPracticeIdentityId(),
          ...state,
          role,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to create practice interview");
      }

      const interview = payload.interview;
      const params = new URLSearchParams({
        coding: state.coding ? "true" : "false",
        interviewId: interview.interviewId,
        token: interview.token,
        link: interview.link,
      });

      router.push(`/interview/precheck?${params.toString()}`);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Unable to create practice interview");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <form className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={(event) => event.preventDefault()}>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Role"
            value={state.role}
            placeholder="e.g. Senior Java Developer, DBA, Product Manager"
            onChange={(role) => setState((current) => ({ ...current, role }))}
          />
          <SelectField label="Experience" value={state.experience} values={setupOptions.experience} onChange={(experience) => setState((current) => ({ ...current, experience }))} />
          <SelectField label="Difficulty" value={state.difficulty} values={setupOptions.difficulty} onChange={(difficulty) => setState((current) => ({ ...current, difficulty }))} />
          <SelectField label="Interview type" value={state.interviewType} values={setupOptions.types} onChange={(interviewType) => setState((current) => ({ ...current, interviewType }))} />
          <SelectField label="Language" value={state.language} values={setupOptions.languages} onChange={(language) => setState((current) => ({ ...current, language }))} />
          <SelectField label="Duration" value={state.duration} values={setupOptions.durations} onChange={(duration) => setState((current) => ({ ...current, duration }))} />
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={state.coding}
            onChange={(event) => setState((current) => ({ ...current, coding: event.target.checked }))}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          <span>
            <span className="flex items-center gap-2 font-semibold text-slate-950">
              <Code2 size={18} aria-hidden="true" />
              Include coding round
            </span>
            <span className="mt-1 block text-sm leading-6 text-slate-600">
              When enabled, the generated interview job requests the existing coding interview implementation.
            </span>
          </span>
        </label>

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={startInterview}
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}
            {loading ? "Creating interview" : "Start Interview"}
          </button>
          <Link
            href="/calm-room"
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-base font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            Open Calm Room
          </Link>
        </div>
      </form>

      <aside className="rounded-lg border border-blue-100 bg-blue-50 p-6">
        <h2 className="text-lg font-semibold text-slate-950">Launch sequence</h2>
        <div className="mt-5 grid gap-4">
          {sequence.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.text} className="flex gap-3 rounded-lg bg-white p-4 text-sm font-medium text-slate-700">
                <Icon className="text-blue-600" size={18} aria-hidden="true" />
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>
      </aside>
    </section>
  );
}

function SelectField({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        {values.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={120}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
      <span className="text-xs leading-5 text-slate-500">
        Type any target role. VERIS will use this role to shape the practice interview.
      </span>
    </label>
  );
}
