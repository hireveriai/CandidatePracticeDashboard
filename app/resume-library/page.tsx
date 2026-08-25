import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import ResumeUploadCard from "@/components/practice/ResumeUploadCard";
import ResumeVersionCard from "@/components/practice/ResumeVersionCard";
import { getOptionalCandidateId } from "@/lib/server/resume/auth";
import { listCandidateResumes, type CandidateResumeRow } from "@/lib/server/resume/resume-store";
import { getPracticeDashboard } from "@/lib/server/practice-candidate";
import { getSessionIdentityId } from "@/lib/server/session";

function groupIntoFamilies(resumes: CandidateResumeRow[]) {
  const originals = resumes.filter((resume) => resume.enhancementType === "original");
  const byParent = new Map<string, CandidateResumeRow[]>();

  for (const resume of resumes) {
    if (resume.parentResumeId) {
      const list = byParent.get(resume.parentResumeId) ?? [];
      list.push(resume);
      byParent.set(resume.parentResumeId, list);
    }
  }

  return originals.map((original) => ({
    original,
    versions: (byParent.get(original.resumeId) ?? []).sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    ),
  }));
}

export default async function ResumeLibraryPage() {
  const identityId = await getSessionIdentityId();
  const candidateId = await getOptionalCandidateId();
  const [dashboard, resumes] = await Promise.all([
    getPracticeDashboard(identityId ?? undefined),
    candidateId ? listCandidateResumes(candidateId) : Promise.resolve([]),
  ]);

  const families = groupIntoFamilies(resumes);

  return (
    <PracticeShell candidateName={dashboard.candidate?.fullName ?? undefined}>
      <PageHeader
        eyebrow="Resume library"
        title="Prepare resumes for each target role"
        description="Upload a resume, then use VERIS AI Enhancement to strengthen it -- your original is always kept untouched."
      />

      {families.length ? (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900">Ready to improve a resume with VERIS AI?</p>
          <Link
            href="/resume-enhancement"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Sparkles size={16} aria-hidden="true" />
            Resume Enhancement
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5">
        {families.map(({ original, versions }) => (
          <section key={original.resumeId} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {original.structuredData.candidate.fullName || "Resume"}
            </h2>
            <div className="mt-3 grid gap-2">
              <ResumeVersionCard resume={original} indent={false} />
              {versions.map((version) => (
                <ResumeVersionCard key={version.resumeId} resume={version} indent />
              ))}
            </div>
          </section>
        ))}

        <ResumeUploadCard />
      </div>
    </PracticeShell>
  );
}
