import PracticeDashboard from "@/components/practice/PracticeDashboard";
import { getPracticeDashboard } from "@/lib/server/practice-candidate";
import { getSessionIdentityId } from "@/lib/server/session";

export default async function Dashboard() {
  const identityId = await getSessionIdentityId();
  const data = await getPracticeDashboard(identityId ?? undefined);

  return <PracticeDashboard data={data} />;
}
