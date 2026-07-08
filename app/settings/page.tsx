import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";

export default function SettingsPage() {
  return (
    <PracticeShell>
      <PageHeader
        eyebrow="Settings"
        title="Tune the practice experience"
        description="Candidate-facing preferences for coaching tone, reminders, accessibility, and interview defaults."
      />

      <section className="grid gap-5 lg:grid-cols-2">
        {[
          ["Coaching tone", "Calm and direct"],
          ["Default duration", "30 minutes"],
          ["Accessibility", "Captions and larger controls enabled"],
          ["Reminder cadence", "Twice a week"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>
    </PracticeShell>
  );
}
