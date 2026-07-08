import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import { resumeItems } from "@/components/practice/data";

export default function ResumeLibraryPage() {
  return (
    <PracticeShell>
      <PageHeader
        eyebrow="Resume library"
        title="Prepare resumes for each target role"
        description="Keep candidate resumes ready for practice, role matching, and interview coaching prompts."
      />

      <section className="grid gap-5 lg:grid-cols-2">
        {resumeItems.map((item) => (
          <div key={item.name} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <FileText className="text-blue-600" size={26} aria-hidden="true" />
            <h2 className="mt-5 text-xl font-semibold text-slate-950">{item.name}</h2>
            <p className="mt-2 text-sm text-slate-500">{item.updated}</p>
            <p className="mt-4 rounded-md bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700">{item.match}</p>
          </div>
        ))}
        <Link
          href="/resume-library"
          className="flex min-h-56 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
        >
          <span>
            <Plus className="mx-auto text-blue-600" size={28} aria-hidden="true" />
            <span className="mt-3 block font-semibold text-slate-950">Add resume</span>
            <span className="mt-1 block text-sm text-slate-500">Frontend placeholder for future upload integration.</span>
          </span>
        </Link>
      </section>
    </PracticeShell>
  );
}
