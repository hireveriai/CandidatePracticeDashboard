import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import StartInterviewForm from "@/components/practice/StartInterviewForm";

export default function InterviewSetup() {
  return (
    <PracticeShell>
      <PageHeader
        eyebrow="Start mock interview"
        title="Design your practice session"
        description="Choose the interview shape. Starting creates a practice candidate, job, interview, and invite token through the existing HireVeri database functions."
      />

      <StartInterviewForm />
    </PracticeShell>
  );
}
