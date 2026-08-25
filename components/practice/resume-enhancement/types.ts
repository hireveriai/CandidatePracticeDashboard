export type StructuredResume = {
  candidate: { fullName: string | null; email: string | null; phone: string | null; location: string | null };
  summary: string;
  experience: Array<{
    title: string;
    employer: string;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
    bullets: string[];
  }>;
  skills: string[];
  education: Array<{ degree: string; institution: string; year: string | null }>;
  certifications: string[];
  projects: Array<{ name: string; description: string }>;
};

export type ResumeListItem = {
  resumeId: string;
  enhancementType: "original" | "ai_enhancement" | "interview_enhancement";
  parentResumeId: string | null;
  structuredData: StructuredResume;
  isCurrent: boolean;
  createdAt: string;
};

export type EligibleInterview = {
  attemptId: string;
  interviewId: string;
  jobTitle: string | null;
  interviewDate: string | null;
  durationSeconds: number | null;
  overallScore: number | null;
  status: string;
  hasTranscript: boolean;
  hasReport: boolean;
};

export type Suggestion = {
  suggestionId: string;
  sessionId: string;
  fieldPath: string;
  suggestionType: "rewrite" | "add" | "strengthen";
  currentText: string | null;
  suggestedText: string;
  source: "resume" | "interview" | "both";
  evidence: string;
  confidence: number;
  requiresConfirmation: boolean;
  decision: "pending" | "accepted" | "rejected";
};

export type EnhancementMode = "ai_enhancement" | "interview_enhancement";

export type PricingTier = "standard" | "premium";

export type ResumeTemplate = {
  id: string;
  name: string;
  tier: PricingTier;
  description: string;
  accent: string;
  muted: string;
  layout: "single" | "divider";
};

export const CURRENCY_SYMBOL: Record<string, string> = {
  INR: "₹",
  USD: "$",
  GBP: "£",
  EUR: "€",
};
