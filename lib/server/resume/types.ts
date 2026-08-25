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

/** Flattens structured resume data back to plain text for consumers that
 * only understand raw resume text (Calm Room's resume-aware question seed). */
export function flattenResumeToText(resume: StructuredResume): string {
  const lines: string[] = [];

  if (resume.candidate.fullName) lines.push(resume.candidate.fullName);
  const contact = [resume.candidate.email, resume.candidate.phone, resume.candidate.location].filter(Boolean);
  if (contact.length) lines.push(contact.join(" | "));
  if (resume.summary?.trim()) lines.push("", "Summary", resume.summary.trim());

  if (resume.experience.length) {
    lines.push("", "Experience");
    for (const entry of resume.experience) {
      lines.push(`${entry.title}${entry.employer ? ` - ${entry.employer}` : ""}`);
      for (const bullet of entry.bullets) lines.push(`- ${bullet}`);
    }
  }

  if (resume.skills.length) lines.push("", "Skills", resume.skills.join(", "));

  if (resume.projects.length) {
    lines.push("", "Projects");
    for (const project of resume.projects) lines.push(`${project.name}: ${project.description}`);
  }

  if (resume.education.length) {
    lines.push("", "Education");
    for (const entry of resume.education) lines.push(`${entry.degree} - ${entry.institution}${entry.year ? ` (${entry.year})` : ""}`);
  }

  if (resume.certifications.length) lines.push("", "Certifications", resume.certifications.join(", "));

  return lines.join("\n");
}

export const EMPTY_STRUCTURED_RESUME: StructuredResume = {
  candidate: { fullName: null, email: null, phone: null, location: null },
  summary: "",
  experience: [],
  skills: [],
  education: [],
  certifications: [],
  projects: [],
};
