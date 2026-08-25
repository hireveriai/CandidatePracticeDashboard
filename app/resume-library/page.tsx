import { FileText } from "lucide-react";
import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import { getPracticeDashboard } from "@/lib/server/practice-candidate";
import { getSessionIdentityId } from "@/lib/server/session";

export default async function ResumeLibraryPage() {
  const identityId = await getSessionIdentityId();
  const data = await getPracticeDashboard(identityId ?? undefined);

  return (
    <PracticeShell candidateName={data.candidate?.fullName ?? undefined}>
      <PageHeader
        eyebrow="Resume library"
        title="Prepare resumes for each target role"
        description="Keep candidate resumes ready for practice, role matching, and interview coaching prompts."
      />

      <section className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <FileText size={26} aria-hidden="true" />
        </span>
        <h2 className="text-lg font-semibold text-slate-950">No resumes uploaded yet</h2>
        <p className="max-w-md text-sm leading-6 text-slate-600">
          Resume upload isn&rsquo;t available for practice candidates yet. When it launches, resumes you add here
          will be matched against roles you practice for.
        </p>
      </section>
    </PracticeShell>
  );
}
