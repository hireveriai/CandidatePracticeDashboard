import PageHeader from "@/components/practice/PageHeader";
import PracticeShell from "@/components/practice/PracticeShell";
import { getPracticeDashboard } from "@/lib/server/practice-candidate";
import { getSessionIdentityId } from "@/lib/server/session";

function formatDate(value: string | null) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function SettingsPage() {
  const identityId = await getSessionIdentityId();
  const data = await getPracticeDashboard(identityId ?? undefined);
  const candidate = data.candidate;

  const fields: Array<[string, string]> = [
    ["Full name", candidate?.fullName?.trim() || "Not set"],
    ["Email", candidate?.email || "Not available for this session"],
    ["Organization", candidate?.organizationName || "Not linked to an organization"],
    ["Account created", formatDate(candidate?.createdAt ?? null)],
  ];

  return (
    <PracticeShell candidateName={candidate?.fullName ?? undefined}>
      <PageHeader
        eyebrow="Settings"
        title="Your account"
        description="Account details on file with VerisNova for this practice candidate. Preference controls (coaching tone, reminders, accessibility) aren't available yet."
      />

      <section className="grid gap-5 lg:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 truncate text-xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>
    </PracticeShell>
  );
}
