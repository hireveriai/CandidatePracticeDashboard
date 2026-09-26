import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import StartInterviewForm from "@/components/practice/StartInterviewForm";
import { getPracticeDashboard } from "@/lib/server/practice-candidate";
import { getSessionIdentityId } from "@/lib/server/session";

export default async function InterviewSetup() {
  const identityId = await getSessionIdentityId();
  const dashboard = await getPracticeDashboard(identityId ?? undefined);

  return (
    <PracticeShell candidateName={dashboard.candidate?.fullName ?? undefined}>
      <PageHeader
        eyebrow="Start mock interview"
        title="Design your practice session"
        description="Choose the role and interview style. VERIS AI tailors the questions to your choices, then runs a realistic mock interview with feedback."
      />

      <StartInterviewForm />
    </PracticeShell>
  );
}
