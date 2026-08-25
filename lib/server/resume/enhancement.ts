import { callOpenAIJson, OPENAI_MODEL } from "./openai";
import type { ResumeEnhancementSuggestion, StructuredResume } from "./types";

const STRUCTURED_RESUME_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    candidate: {
      type: "object",
      additionalProperties: false,
      properties: {
        fullName: { anyOf: [{ type: "string" }, { type: "null" }] },
        email: { anyOf: [{ type: "string" }, { type: "null" }] },
        phone: { anyOf: [{ type: "string" }, { type: "null" }] },
        location: { anyOf: [{ type: "string" }, { type: "null" }] },
      },
      required: ["fullName", "email", "phone", "location"],
    },
    summary: { type: "string" },
    experience: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          employer: { type: "string" },
          location: { anyOf: [{ type: "string" }, { type: "null" }] },
          startDate: { anyOf: [{ type: "string" }, { type: "null" }] },
          endDate: { anyOf: [{ type: "string" }, { type: "null" }] },
          bullets: { type: "array", items: { type: "string" } },
        },
        required: ["title", "employer", "location", "startDate", "endDate", "bullets"],
      },
    },
    skills: { type: "array", items: { type: "string" } },
    education: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          degree: { type: "string" },
          institution: { type: "string" },
          year: { anyOf: [{ type: "string" }, { type: "null" }] },
        },
        required: ["degree", "institution", "year"],
      },
    },
    certifications: { type: "array", items: { type: "string" } },
    projects: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
        required: ["name", "description"],
      },
    },
  },
  required: ["candidate", "summary", "experience", "skills", "education", "certifications", "projects"],
};

const SUGGESTIONS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          fieldPath: { type: "string" },
          suggestionType: { type: "string", enum: ["rewrite", "add", "strengthen"] },
          currentText: { anyOf: [{ type: "string" }, { type: "null" }] },
          suggestedText: { type: "string" },
          source: { type: "string", enum: ["resume", "interview", "both"] },
          evidence: { type: "string" },
          confidence: { type: "number" },
          requiresConfirmation: { type: "boolean" },
        },
        required: [
          "fieldPath",
          "suggestionType",
          "currentText",
          "suggestedText",
          "source",
          "evidence",
          "confidence",
          "requiresConfirmation",
        ],
      },
    },
  },
  required: ["suggestions"],
};

const NO_FABRICATION_RULES = [
  "Never invent or embellish: employers, job titles, technologies, metrics/numbers, certifications, years of experience, or degrees that are not explicitly present in the provided source material.",
  "Every fact you add must be traceable to either the existing resume text or the interview material provided -- never to general assumptions about what someone in this role 'probably' did.",
  "If evidence is weak or ambiguous, do not propose the change at all rather than guessing.",
  "Never propose a brand-new employer or job title that isn't already on the resume -- you may only strengthen or add detail to a role that already exists in the resume's experience list.",
].join(" ");

const FIELD_PATH_RULE =
  "fieldPath must be exactly one of these forms (indices refer to the given resume JSON's array positions): 'summary' | 'skills' | 'certifications' | 'projects' | 'experience[i].bullets' (add a new bullet to that existing role) | 'experience[i].bullets[j]' (rewrite that existing bullet) | 'experience[i].location'. Never use any other fieldPath -- never 'candidate.*', never 'experience[i].employer', never 'experience[i].title', never 'experience[i].startDate'/'endDate', never a bare top-level field like 'location' or 'employer'.";

const FIELD_PATH_PATTERN = /^([a-zA-Z]+)(?:\[(\d+)\])?(?:\.([a-zA-Z]+)(?:\[(\d+)\])?)?$/;
const BLOCKED_SUBFIELDS = new Set(["employer", "title", "startDate", "endDate"]);
const ALLOWED_BARE_SECTIONS = new Set(["summary", "skills", "certifications", "projects"]);

/** Drops any suggestion whose fieldPath the application layer can't safely apply. */
function hasSupportedFieldPath(suggestion: ResumeEnhancementSuggestion) {
  const match = suggestion.fieldPath.match(FIELD_PATH_PATTERN);
  if (!match) return false;

  const [, section, index, subfield] = match;

  if (subfield && BLOCKED_SUBFIELDS.has(subfield)) return false;
  if (index === undefined) return ALLOWED_BARE_SECTIONS.has(section);
  if (section !== "experience") return false;
  if (subfield === undefined) return false;
  return subfield === "bullets" || subfield === "location";
}

export async function structureResumeText(rawText: string) {
  const { data } = await callOpenAIJson<StructuredResume>({
    schemaName: "structured_resume",
    schema: STRUCTURED_RESUME_SCHEMA,
    system: [
      "You convert raw resume text into structured JSON.",
      "This is a faithful transcription, not an enhancement: extract only what is explicitly present in the text.",
      "Do not add, infer, guess, or improve anything. If a field is not present, use an empty string, empty array, or null as appropriate.",
      "Preserve the candidate's own wording for bullets and summary -- do not rewrite or paraphrase.",
    ].join(" "),
    user: rawText.slice(0, 14_000),
  });

  return data;
}

const HIGH_RISK_ADD_FIELDS = new Set(["skills", "certifications", "projects"]);

/**
 * Defense in depth beyond the prompt: in AI-only mode nothing may be added
 * that isn't already grounded in the resume's own text. This is the
 * fabrication failure mode observed in testing (the model inventing a
 * certification, skills, and whole projects the resume never mentioned), so
 * every 'add' onto skills/certifications/projects is required to point at
 * resume text that actually contains it -- ungrounded suggestions are
 * dropped rather than shown to the candidate.
 */
function isGroundedInResumeText(resume: StructuredResume, suggestion: ResumeEnhancementSuggestion) {
  if (suggestion.suggestionType !== "add" || !HIGH_RISK_ADD_FIELDS.has(suggestion.fieldPath)) {
    return true;
  }

  const haystack = JSON.stringify(resume).toLowerCase();
  const needle = (suggestion.evidence || suggestion.currentText || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .trim();
  const words = needle.split(/\s+/).filter((word) => word.length > 3);

  if (!words.length) {
    return false;
  }

  const matched = words.filter((word) => haystack.includes(word)).length;
  return matched / words.length >= 0.6;
}

/** Applies to both modes: drops anything the application layer can't act on. */
function filterSupportedFieldPaths(suggestions: ResumeEnhancementSuggestion[]) {
  return suggestions.filter(hasSupportedFieldPath);
}

/**
 * AI-only mode exclusively: also requires every addition to be grounded in
 * the resume's own text. Never applied to interview-insight suggestions,
 * whose whole point is surfacing evidence that lives in the transcript
 * rather than the resume.
 */
export function filterGroundedSuggestions(resume: StructuredResume, suggestions: ResumeEnhancementSuggestion[]) {
  return filterSupportedFieldPaths(suggestions).filter((suggestion) => isGroundedInResumeText(resume, suggestion));
}

export async function generateAiOnlyEnhancement(resume: StructuredResume) {
  const { data, inputTokens, outputTokens } = await callOpenAIJson<{ suggestions: ResumeEnhancementSuggestion[] }>({
    schemaName: "resume_enhancement_suggestions",
    schema: SUGGESTIONS_SCHEMA,
    system: [
      "You are VERIS, a resume enhancement assistant. You have ONLY the candidate's existing resume -- no interview or other source of information about them exists in this mode.",
      "Your job here is strictly rewording and reorganizing what is ALREADY on the resume: clarity, ATS-friendliness, grammar, wording strength, and formatting consistency.",
      NO_FABRICATION_RULES,
      "CRITICAL: in this mode you may NEVER introduce a skill, certification, project, employer, responsibility, or achievement that is not already written somewhere on the resume, even if it seems like a typical or plausible thing for someone in this role to have. If it is not already on the resume, it does not exist for the purposes of this task -- do not guess, infer from job title, or fill perceived gaps.",
      "The only correct use of suggestionType 'add' in this mode is moving/surfacing something the candidate already wrote elsewhere on the resume into a more appropriate section (e.g. a technology named inside an experience bullet that is missing from the Skills list). Evidence must quote the exact existing resume text that already states it.",
      "Do not add a new project, a new certification, or a new skill category that has zero prior mention anywhere in the given resume JSON. If the resume has no Projects or Certifications, leave those sections alone rather than inventing entries for them.",
      "Do not fabricate measurable achievements (percentages, dollar amounts, counts) that the candidate did not state. Prefer strengthening the description of the work itself over inventing a metric.",
      "For every suggestion set source to 'resume' and evidence to the exact resume text that justifies the change.",
      FIELD_PATH_RULE,
      "suggestionType is 'rewrite' for replacing existing text, 'add' only for the resume-internal relocation case above, 'strengthen' for making an existing claim more specific without changing its meaning or adding new facts.",
      "Only propose changes that are a real improvement. Do not propose a change just to have one for every section.",
      "Return at most 10 suggestions, ordered by impact.",
    ].join(" "),
    user: JSON.stringify({ resume }),
  });

  return { suggestions: filterGroundedSuggestions(resume, data.suggestions ?? []), inputTokens, outputTokens };
}

export async function generateInterviewInsightEnhancement(input: {
  resume: StructuredResume;
  transcriptExcerpt: string;
  interviewReport: {
    role: string | null;
    strengths: string | null;
    weaknesses: string | null;
    overallScore: number | null;
  };
}) {
  const { data, inputTokens, outputTokens } = await callOpenAIJson<{ suggestions: ResumeEnhancementSuggestion[] }>({
    schemaName: "resume_interview_enhancement_suggestions",
    schema: SUGGESTIONS_SCHEMA,
    system: [
      "You are VERIS, a resume enhancement assistant. You are given a candidate's existing resume AND a transcript of a VERIS practice interview they completed for a specific role, plus VERIS's evaluation notes for that interview.",
      "Your job: find experience, technologies, projects, responsibilities, or achievements the candidate clearly described in the interview that are missing or under-represented on the resume, and propose adding or strengthening that detail.",
      NO_FABRICATION_RULES,
      "A statement only counts as usable evidence if the candidate stated it themselves in the transcript (as the 'Candidate:' speaker) -- interviewer questions, VERIS commentary, or your own inference are never evidence.",
      "For interview-derived suggestions set source to 'interview' and requiresConfirmation to true, and evidence must closely paraphrase or quote what the candidate actually said, including which part of the transcript it came from.",
      "If a change draws on both the resume and something the candidate said, set source to 'both'.",
      FIELD_PATH_RULE,
      "Never propose adding a whole new employer/role that isn't already in the resume's experience array -- only add detail to roles that already exist there.",
      "Do not repeat information that is already clearly present in the resume -- only propose what's missing or weak.",
      "Return at most 10 suggestions, ordered by impact.",
    ].join(" "),
    user: JSON.stringify({
      resume: input.resume,
      interview: {
        role: input.interviewReport.role,
        verisStrengths: input.interviewReport.strengths,
        verisWeaknesses: input.interviewReport.weaknesses,
        overallScore: input.interviewReport.overallScore,
      },
      transcriptExcerpt: input.transcriptExcerpt,
    }),
  });

  return { suggestions: filterSupportedFieldPaths(data.suggestions ?? []), inputTokens, outputTokens };
}

export { OPENAI_MODEL };
