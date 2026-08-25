import type { StructuredResume } from "./types";

export default function ResumePreview({
  resume,
  accent = "1D4ED8",
  layout = "single",
}: {
  resume: StructuredResume;
  accent?: string;
  layout?: "single" | "divider";
}) {
  const contactParts = [resume.candidate.email, resume.candidate.phone, resume.candidate.location].filter(Boolean);
  const accentColor = `#${accent}`;
  const headingClass = "text-xs font-semibold uppercase tracking-wide";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {layout === "divider" ? (
        <div className="mb-3 h-1.5 w-10 rounded-full" style={{ backgroundColor: accentColor }} aria-hidden="true" />
      ) : null}
      <h2 className="text-2xl font-semibold" style={{ color: layout === "divider" ? accentColor : undefined }}>
        {resume.candidate.fullName || "Candidate"}
      </h2>
      {contactParts.length ? <p className="mt-1 text-sm text-slate-500">{contactParts.join("  ·  ")}</p> : null}

      {resume.summary?.trim() ? (
        <section className="mt-5">
          <h3 className={headingClass} style={{ color: accentColor }}>
            Professional Summary
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">{resume.summary}</p>
        </section>
      ) : null}

      {resume.experience.length ? (
        <section className="mt-5">
          <h3 className={headingClass} style={{ color: accentColor }}>
            Experience
          </h3>
          <div className="mt-2 grid gap-4">
            {resume.experience.map((entry, index) => (
              <div key={index}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="font-semibold text-slate-950">
                    {entry.title}
                    {entry.employer ? ` - ${entry.employer}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    {[entry.startDate, entry.endDate].filter(Boolean).join(" - ")}
                  </p>
                </div>
                {entry.location ? <p className="text-xs text-slate-500">{entry.location}</p> : null}
                {entry.bullets.length ? (
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                    {entry.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {resume.skills.length ? (
        <section className="mt-5">
          <h3 className={headingClass} style={{ color: accentColor }}>
            Skills
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {resume.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md px-2.5 py-1 text-xs font-medium"
                style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {resume.projects.length ? (
        <section className="mt-5">
          <h3 className={headingClass} style={{ color: accentColor }}>
            Projects
          </h3>
          <div className="mt-2 grid gap-2">
            {resume.projects.map((project, index) => (
              <div key={index}>
                <p className="text-sm font-semibold text-slate-950">{project.name}</p>
                <p className="text-sm leading-6 text-slate-700">{project.description}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {resume.education.length ? (
        <section className="mt-5">
          <h3 className={headingClass} style={{ color: accentColor }}>
            Education
          </h3>
          <div className="mt-2 grid gap-1">
            {resume.education.map((entry, index) => (
              <div key={index} className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-semibold text-slate-950">
                  {entry.degree} - {entry.institution}
                </p>
                {entry.year ? <p className="text-xs text-slate-500">{entry.year}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {resume.certifications.length ? (
        <section className="mt-5">
          <h3 className={headingClass} style={{ color: accentColor }}>
            Certifications
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">{resume.certifications.join("  •  ")}</p>
        </section>
      ) : null}

      <p className="mt-8 border-t border-slate-100 pt-3 text-xs text-slate-400">Enhanced with VERIS AI by VerisNova</p>
    </div>
  );
}
