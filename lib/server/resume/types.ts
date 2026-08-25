export type ResumeExperienceEntry = {
  title: string;
  employer: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  bullets: string[];
};

export type ResumeEducationEntry = {
  degree: string;
  institution: string;
  year: string | null;
};

export type ResumeProjectEntry = {
  name: string;
  description: string;
};

export type StructuredResume = {
  candidate: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
  };
  summary: string;
  experience: ResumeExperienceEntry[];
  skills: string[];
  education: ResumeEducationEntry[];
  certifications: string[];
  projects: ResumeProjectEntry[];
};

export type SuggestionSource = "resume" | "interview" | "both";
export type SuggestionType = "rewrite" | "add" | "strengthen";

export type ResumeEnhancementSuggestion = {
  fieldPath: string;
  suggestionType: SuggestionType;
  currentText: string | null;
  suggestedText: string;
  source: SuggestionSource;
  evidence: string;
  confidence: number;
  requiresConfirmation: boolean;
};

export const EMPTY_STRUCTURED_RESUME: StructuredResume = {
  candidate: { fullName: null, email: null, phone: null, location: null },
  summary: "",
  experience: [],
  skills: [],
  education: [],
  certifications: [],
  projects: [],
};
