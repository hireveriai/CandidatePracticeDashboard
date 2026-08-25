import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import ResumeEnhancementWizard from "@/components/practice/resume-enhancement/ResumeEnhancementWizard";
import { getPracticeDashboard } from "@/lib/server/practice-candidate";
import { getSessionIdentityId } from "@/lib/server/session";

export default async function ResumeEnhancementPage() {
  const identityId = await getSessionIdentityId();
  const dashboard = await getPracticeDashboard(identityId ?? undefined);

  return (
    <PracticeShell candidateName={dashboard.candidate?.fullName ?? undefined}>
      <PageHeader
        eyebrow="Resume enhancement"
        title="Enhance your resume with VERIS AI"
        description="Make your resume clearer, stronger, more professional and ATS-friendly."
      />
      <ResumeEnhancementWizard />
    </PracticeShell>
  );
}
