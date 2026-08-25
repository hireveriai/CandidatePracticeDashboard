import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { StructuredResume } from "./types";
import type { ResumeTemplate } from "./templates";

function dateRange(startDate: string | null, endDate: string | null) {
  const start = startDate?.trim();
  const end = endDate?.trim();
  if (!start && !end) return "";
  return `${start || ""} - ${end || "Present"}`;
}

function sectionHeading(text: string, accent: string, layout: ResumeTemplate["layout"]) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: layout === "divider" ? 10 : 6, color: accent, space: 2 },
    },
    children: [new TextRun({ text: text.toUpperCase(), color: accent, bold: true, size: 22 })],
  });
}

export async function renderResumeDocx(resume: StructuredResume, template: ResumeTemplate): Promise<Buffer> {
  const ACCENT = template.accent;
  const MUTED = template.muted;
  const heading = (text: string) => sectionHeading(text, ACCENT, template.layout);
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: resume.candidate.fullName || "Candidate", bold: true, size: 40 })],
    })
  );

  const contactParts = [resume.candidate.email, resume.candidate.phone, resume.candidate.location].filter(Boolean);
  if (contactParts.length) {
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: contactParts.join("   |   "), color: MUTED, size: 20 })],
      })
    );
  }

  if (resume.summary?.trim()) {
    children.push(heading("Professional Summary"));
    children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: resume.summary.trim(), size: 21 })] }));
  }

  if (resume.experience.length) {
    children.push(heading("Experience"));
    resume.experience.forEach((entry) => {
      children.push(
        new Paragraph({
          spacing: { before: 120 },
          children: [
            new TextRun({ text: `${entry.title}${entry.employer ? ` - ${entry.employer}` : ""}`, bold: true, size: 22 }),
            new TextRun({ text: `    ${dateRange(entry.startDate, entry.endDate)}`, color: MUTED, size: 19 }),
          ],
        })
      );
      if (entry.location) {
        children.push(new Paragraph({ children: [new TextRun({ text: entry.location, color: MUTED, size: 19 })] }));
      }
      entry.bullets.forEach((bullet) => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [new TextRun({ text: bullet, size: 21 })],
          })
        );
      });
    });
  }

  if (resume.skills.length) {
    children.push(heading("Skills"));
    children.push(new Paragraph({ children: [new TextRun({ text: resume.skills.join("  •  "), size: 21 })] }));
  }

  if (resume.projects.length) {
    children.push(heading("Projects"));
    resume.projects.forEach((project) => {
      children.push(
        new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: project.name, bold: true, size: 21 })] })
      );
      children.push(new Paragraph({ children: [new TextRun({ text: project.description, size: 21 })] }));
    });
  }

  if (resume.education.length) {
    children.push(heading("Education"));
    resume.education.forEach((entry) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${entry.degree} - ${entry.institution}`, bold: true, size: 21 }),
            new TextRun({ text: entry.year ? `    ${entry.year}` : "", color: MUTED, size: 19 }),
          ],
        })
      );
    });
  }

  if (resume.certifications.length) {
    children.push(heading("Certifications"));
    children.push(new Paragraph({ children: [new TextRun({ text: resume.certifications.join("  •  "), size: 21 })] }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [new TextRun({ text: "Enhanced with VERIS AI by VerisNova", size: 16, color: MUTED })],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
