import PracticeDashboard from "@/components/practice/PracticeDashboard";
import { getPracticeDashboard } from "@/lib/server/practice-candidate";
import { getPracticePricing } from "@/lib/server/practice-pricing";
import { getSessionIdentityId } from "@/lib/server/session";
import { headers } from "next/headers";

export default async function Home() {
  const identityId = await getSessionIdentityId();
  const requestHeaders = await headers();
  const country = (requestHeaders.get("x-vercel-ip-country") || requestHeaders.get("cf-ipcountry") || "IN").toUpperCase();
  const [data, pricing] = await Promise.all([
    getPracticeDashboard(identityId ?? undefined),
    getPracticePricing(identityId, country === "IN" ? "INR" : "USD"),
  ]);

  return <PracticeDashboard data={data} pricing={pricing} />;
}
