import { Info } from "lucide-react";
import DeviceChecks from "@/components/practice/DeviceChecks";
import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import PrecheckReadyAction from "@/components/practice/PrecheckReadyAction";
import { getPracticeDashboard } from "@/lib/server/practice-candidate";
import { getSessionIdentityId } from "@/lib/server/session";

export default async function InterviewPrecheck({
  searchParams,
}: {
  searchParams: Promise<{
    link?: string;
    token?: string;
    interviewId?: string;
  }>;
}) {
  const params = await searchParams;
  const identityId = await getSessionIdentityId();
  const dashboard = await getPracticeDashboard(identityId ?? undefined);

  return (
    <PracticeShell candidateName={dashboard.candidate?.fullName ?? undefined}>
      <PageHeader
        eyebrow="Interview readiness"
        title="Check your setup before Veris begins"
        description="Confirm your setup, understand what to expect, and begin when you are comfortable and ready."
      />

      <section className="grid items-start gap-5 lg:grid-cols-[1fr_380px]">
        <DeviceChecks />

        <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Instructions</h2>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
            <p>Keep your face centered and use a quiet environment.</p>
            <p>Answer naturally. Veris evaluates the content and structure of your responses and may ask relevant follow-up questions.</p>
            <p>If you lose connection, return using the same interview link to continue when recovery is available.</p>
          </div>
          <div className="mt-5 flex gap-3 rounded-lg bg-indigo-50 p-4 text-sm text-indigo-900">
            <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>
              Your session may use camera, microphone, recording, transcript, and session-event data to prepare interview feedback. AI provides decision support; a person remains responsible for any hiring decision.
            </span>
          </div>
          <PrecheckReadyAction link={params.link} />
        </aside>
      </section>
    </PracticeShell>
  );
}
