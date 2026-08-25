import type { ResumeEnhancementSuggestion, StructuredResume } from "./types";

const FIELD_PATH_PATTERN = /^([a-zA-Z]+)(?:\[(\d+)\])?(?:\.([a-zA-Z]+)(?:\[(\d+)\])?)?$/;

const BLOCKED_SUBFIELDS = new Set(["employer", "title"]);

function splitListAddition(text: string) {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Applies one accepted suggestion to a deep clone of the resume. Deliberately
 * narrow: only the field shapes the enhancement prompts are allowed to
 * reference are supported, and edits to an experience entry's employer/title
 * are refused outright (defense in depth on top of the prompt instruction --
 * VERIS must never be able to rename or fabricate an employer).
 */
export function applySuggestionToResume(
  resume: StructuredResume,
  suggestion: Pick<ResumeEnhancementSuggestion, "fieldPath" | "suggestionType" | "suggestedText">
): StructuredResume {
  const match = suggestion.fieldPath.match(FIELD_PATH_PATTERN);
  if (!match) {
    return resume;
  }

  const [, section, indexStr, subfield, subIndexStr] = match;
  const index = indexStr !== undefined ? Number(indexStr) : null;
  const subIndex = subIndexStr !== undefined ? Number(subIndexStr) : null;

  if (subfield && BLOCKED_SUBFIELDS.has(subfield)) {
    return resume;
  }

  const next: StructuredResume = JSON.parse(JSON.stringify(resume));

  if (section === "summary" && index === null) {
    next.summary = suggestion.suggestedText;
    return next;
  }

  if ((section === "skills" || section === "certifications") && index === null) {
    const target = next[section];
    const existing = new Set(target.map((item) => item.trim().toLowerCase()));
    for (const item of splitListAddition(suggestion.suggestedText)) {
      if (!existing.has(item.toLowerCase())) {
        target.push(item);
        existing.add(item.toLowerCase());
      }
    }
    return next;
  }

  if (section === "experience" && index !== null && next.experience[index]) {
    const entry = next.experience[index];

    if (subfield === "bullets") {
      if (subIndex !== null) {
        if (entry.bullets[subIndex] !== undefined) {
          entry.bullets[subIndex] = suggestion.suggestedText;
        } else {
          entry.bullets.push(suggestion.suggestedText);
        }
      } else {
        entry.bullets.push(suggestion.suggestedText);
      }
      return next;
    }

    if (subfield === "location") {
      entry.location = suggestion.suggestedText;
      return next;
    }
  }

  if (section === "projects" && index === null && suggestion.suggestionType === "add") {
    const [name, ...rest] = suggestion.suggestedText.split(":");
    next.projects.push({
      name: rest.length ? name.trim().slice(0, 80) : "Project",
      description: (rest.length ? rest.join(":") : suggestion.suggestedText).trim(),
    });
    return next;
  }

  return resume;
}

export function applyAcceptedSuggestions(
  resume: StructuredResume,
  suggestions: Array<Pick<ResumeEnhancementSuggestion, "fieldPath" | "suggestionType" | "suggestedText">>
): StructuredResume {
  return suggestions.reduce((acc, suggestion) => applySuggestionToResume(acc, suggestion), resume);
}
