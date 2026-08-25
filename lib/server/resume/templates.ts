export type PricingTier = "standard" | "premium";

export type ResumeTemplate = {
  id: string;
  name: string;
  tier: PricingTier;
  description: string;
  /** Hex accent color used for headings/rules in both the PDF and DOCX renderers. */
  accent: string;
  /** Muted secondary text color. */
  muted: string;
  /** "single" keeps the current single-column ATS-safe layout; "divider" adds a bolder rule style for a more designed feel. */
  layout: "single" | "divider";
};

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: "veris-professional",
    name: "VERIS Professional",
    tier: "standard",
    description: "Clean, single-column, and built to pass ATS parsing without friction.",
    accent: "1E3A6E",
    muted: "5B6472",
    layout: "single",
  },
  {
    id: "veris-ats",
    name: "VERIS ATS",
    tier: "standard",
    description: "Maximum ATS safety: plain black text, no color, no styling risk.",
    accent: "111827",
    muted: "4B5563",
    layout: "single",
  },
  {
    id: "veris-modern",
    name: "VERIS Modern",
    tier: "standard",
    description: "A modern teal accent with the same trusted, recruiter-friendly structure.",
    accent: "0F766E",
    muted: "52706C",
    layout: "single",
  },
  {
    id: "veris-executive",
    name: "VERIS Executive",
    tier: "premium",
    description: "A refined charcoal-and-gold palette for senior and leadership roles.",
    accent: "8A6D3B",
    muted: "4B4B4B",
    layout: "divider",
  },
  {
    id: "veris-tech",
    name: "VERIS Tech",
    tier: "premium",
    description: "A confident indigo accent suited to engineering and product roles.",
    accent: "4338CA",
    muted: "525873",
    layout: "divider",
  },
  {
    id: "veris-leadership",
    name: "VERIS Leadership",
    tier: "premium",
    description: "Bold section dividers and a deep navy palette for management-track roles.",
    accent: "0B2545",
    muted: "445069",
    layout: "divider",
  },
];

export function getTemplate(templateId: string): ResumeTemplate | null {
  return RESUME_TEMPLATES.find((template) => template.id === templateId) ?? null;
}

export function getDefaultTemplate(tier: PricingTier): ResumeTemplate {
  return RESUME_TEMPLATES.find((template) => template.tier === tier) ?? RESUME_TEMPLATES[0];
}
