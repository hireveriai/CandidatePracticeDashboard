import PracticeDashboard from "@/components/practice/PracticeDashboard";
import { getPracticeDashboard } from "@/lib/server/practice-candidate";
import { getPracticePricing } from "@/lib/server/practice-pricing";
import { getSessionIdentityId } from "@/lib/server/session";

export default async function Home() {
  const identityId = await getSessionIdentityId();
  const [data, pricing] = await Promise.all([
    getPracticeDashboard(identityId ?? undefined),
    getPracticePricing(identityId),
  ]);

  return <PracticeDashboard data={data} pricing={pricing} />;
}
