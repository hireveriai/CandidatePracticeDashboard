import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { StructuredResume } from "./types";
import type { ResumeTemplate } from "./templates";

const PAGE_WIDTH = 612; // US Letter, points
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_TEXT = "Enhanced with VERIS AI by VerisNova";

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

class ResumeLayout {
  doc: PDFDocument;
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  template: ResumeTemplate;
  y = PAGE_HEIGHT - MARGIN;
  pageNumber = 1;

  constructor(doc: PDFDocument, regular: PDFFont, bold: PDFFont, template: ResumeTemplate) {
    this.doc = doc;
    this.regular = regular;
    this.bold = bold;
    this.template = template;
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.drawFooter();
  }

  drawFooter() {
    this.page.drawText(FOOTER_TEXT, {
      x: MARGIN,
      y: MARGIN / 2,
      size: 8,
      font: this.regular,
      color: rgb(0.55, 0.55, 0.58),
    });
  }

  ensureSpace(height: number) {
    if (this.y - height < MARGIN + 20) {
      this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      this.pageNumber += 1;
      this.y = PAGE_HEIGHT - MARGIN;
      this.drawFooter();
    }
  }

  gap(amount: number) {
    this.y -= amount;
  }

  heading(text: string) {
    const accent = hexToRgb(this.template.accent);
    this.ensureSpace(22);
    this.page.drawText(text.toUpperCase(), {
      x: MARGIN,
      y: this.y,
      size: 11,
      font: this.bold,
      color: accent,
    });
    this.y -= 4;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: this.template.layout === "divider" ? 1.5 : 0.75,
      color: accent,
    });
    this.y -= 14;
  }

  paragraph(text: string, size = 10, font?: PDFFont, color = rgb(0.15, 0.15, 0.18)) {
    const usedFont = font ?? this.regular;
    const lines = wrapText(text, usedFont, size, CONTENT_WIDTH);
    for (const line of lines) {
      this.ensureSpace(size + 4);
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font: usedFont, color });
      this.y -= size + 4;
    }
  }

  bullet(text: string) {
    const size = 10;
    const indent = 14;
    const lines = wrapText(text, this.regular, size, CONTENT_WIDTH - indent);
    lines.forEach((line, index) => {
      this.ensureSpace(size + 4);
      if (index === 0) {
        this.page.drawText("-", { x: MARGIN, y: this.y, size, font: this.regular, color: rgb(0.15, 0.15, 0.18) });
      }
      this.page.drawText(line, { x: MARGIN + indent, y: this.y, size, font: this.regular, color: rgb(0.15, 0.15, 0.18) });
      this.y -= size + 4;
    });
  }

  twoColumnLine(left: string, right: string, size = 10.5) {
    this.ensureSpace(size + 4);
    this.page.drawText(left, { x: MARGIN, y: this.y, size, font: this.bold, color: rgb(0.1, 0.1, 0.12) });
    const rightWidth = this.regular.widthOfTextAtSize(right, size - 1);
    this.page.drawText(right, {
      x: PAGE_WIDTH - MARGIN - rightWidth,
      y: this.y,
      size: size - 1,
      font: this.regular,
      color: rgb(0.4, 0.4, 0.45),
    });
    this.y -= size + 4;
  }
}

function dateRange(startDate: string | null, endDate: string | null) {
  const start = startDate?.trim();
  const end = endDate?.trim();
  if (!start && !end) return "";
  return `${start || ""} - ${end || "Present"}`;
}

export async function renderResumePdf(resume: StructuredResume, template: ResumeTemplate): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const layout = new ResumeLayout(doc, regular, bold, template);

  if (template.layout === "divider") {
    layout.page.drawRectangle({ x: MARGIN, y: layout.y, width: 36, height: 4, color: hexToRgb(template.accent) });
    layout.gap(24);
  }

  const name = resume.candidate.fullName || "Candidate";
  layout.page.drawText(name, {
    x: MARGIN,
    y: layout.y,
    size: 20,
    font: bold,
    color: template.layout === "divider" ? hexToRgb(template.accent) : rgb(0.1, 0.1, 0.12),
  });
  layout.gap(24);

  const contactParts = [resume.candidate.email, resume.candidate.phone, resume.candidate.location].filter(Boolean);
  if (contactParts.length) {
    layout.paragraph(contactParts.join("  |  "), 10, regular, rgb(0.35, 0.35, 0.4));
    layout.gap(8);
  }

  if (resume.summary?.trim()) {
    layout.heading("Professional Summary");
    layout.paragraph(resume.summary.trim());
    layout.gap(8);
  }

  if (resume.experience.length) {
    layout.heading("Experience");
    resume.experience.forEach((entry, index) => {
      layout.twoColumnLine(
        `${entry.title}${entry.employer ? ` - ${entry.employer}` : ""}`,
        dateRange(entry.startDate, entry.endDate)
      );
      if (entry.location) {
        layout.paragraph(entry.location, 9.5, regular, rgb(0.4, 0.4, 0.45));
      }
      layout.gap(2);
      entry.bullets.forEach((bullet) => layout.bullet(bullet));
      if (index < resume.experience.length - 1) layout.gap(8);
    });
    layout.gap(8);
  }

  if (resume.skills.length) {
    layout.heading("Skills");
    layout.paragraph(resume.skills.join("  •  "));
    layout.gap(8);
  }

  if (resume.projects.length) {
    layout.heading("Projects");
    resume.projects.forEach((project) => {
      layout.paragraph(project.name, 10.5, bold);
      layout.paragraph(project.description);
      layout.gap(6);
    });
  }

  if (resume.education.length) {
    layout.heading("Education");
    resume.education.forEach((entry) => {
      layout.twoColumnLine(`${entry.degree} - ${entry.institution}`, entry.year ?? "");
    });
    layout.gap(8);
  }

  if (resume.certifications.length) {
    layout.heading("Certifications");
    layout.paragraph(resume.certifications.join("  •  "));
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
