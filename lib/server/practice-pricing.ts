import { query } from "./pg";

export type PracticePlan = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  interviewLimit: number;
  features: string[];
  order: number;
};

export type PracticeSubscription = {
  id: string;
  planId: string;
  planSlug: string;
  planName: string;
  remainingCredits: number;
  usedCredits: number;
  status: string;
  expiresAt: string | null;
} | null;

export type PracticePricingData = {
  plans: PracticePlan[];
  subscription: PracticeSubscription;
};

function normalizeFeatures(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function mapPlan(row: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number | string;
  interviewLimit: number | string;
  features: unknown;
  order: number | string;
}): PracticePlan {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    price: Number(row.price ?? 0),
    interviewLimit: Number(row.interviewLimit ?? 0),
    features: normalizeFeatures(row.features),
    order: Number(row.order ?? 0),
  };
}

export async function getPracticePlans() {
  const { rows } = await query<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    price: number | string;
    interviewLimit: number | string;
    features: unknown;
    order: number | string;
  }>(
    `
      select
        "id",
        "slug",
        "name",
        "description",
        "price",
        "interviewLimit",
        "features",
        "order"
      from public.hireveri_plans
      where "isActive" = true
        and "planType" = 'PRACTICE_CANDIDATE'
      order by "order" asc
    `
  );

  return rows.map(mapPlan);
}

export async function getPracticeSubscription(identityId?: string | null) {
  if (!identityId) {
    return null;
  }

  const { rows } = await query<{
    id: string;
    planId: string;
    planSlug: string;
    planName: string;
    remainingCredits: number | string;
    usedCredits: number | string;
    status: string | null;
    expiresAt: string | null;
  }>(
    `
      select
        s."id",
        s."planId",
        p."slug" as "planSlug",
        p."name" as "planName",
        greatest(coalesce(s."totalCredits", 0), 0) as "remainingCredits",
        greatest(coalesce(s."usedCredits", 0), 0) as "usedCredits",
        coalesce(s."status", 'active') as "status",
        s."expiresAt"::text as "expiresAt"
      from public.hireveri_user_subscriptions s
      join public.hireveri_plans p
        on p."id" = s."planId"
      where s."userId" = $1::text
        and p."planType" = 'PRACTICE_CANDIDATE'
        and coalesce(s."status", 'active') in ('active', 'pending')
      order by
        case when coalesce(s."status", 'active') = 'active' then 0 else 1 end,
        s."updatedAt" desc
      limit 1
    `,
    [identityId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    planId: row.planId,
    planSlug: row.planSlug,
    planName: row.planName,
    remainingCredits: Number(row.remainingCredits ?? 0),
    usedCredits: Number(row.usedCredits ?? 0),
    status: row.status ?? "active",
    expiresAt: row.expiresAt,
  };
}

export async function getPracticePricing(identityId?: string | null): Promise<PracticePricingData> {
  try {
    const [plans, subscription] = await Promise.all([
      getPracticePlans(),
      getPracticeSubscription(identityId),
    ]);

    return { plans, subscription };
  } catch (error) {
    console.warn("Practice pricing read failed", error);
    return { plans: [], subscription: null };
  }
}

export async function consumePracticeInterviewCredit(identityId: string) {
  const { rows } = await query<{
    id: string;
    remainingCredits: number | string;
    usedCredits: number | string;
  }>(
    `
      update public.hireveri_user_subscriptions s
      set
        "totalCredits" = s."totalCredits" - 1,
        "usedCredits" = coalesce(s."usedCredits", 0) + 1,
        "updatedAt" = now()
      from public.hireveri_plans p
      where p."id" = s."planId"
        and p."planType" = 'PRACTICE_CANDIDATE'
        and s."userId" = $1::text
        and coalesce(s."status", 'active') = 'active'
        and (s."expiresAt" is null or s."expiresAt" > now())
        and s."totalCredits" >= 1
      returning
        s."id",
        s."totalCredits" as "remainingCredits",
        s."usedCredits" as "usedCredits"
    `,
    [identityId]
  );

  const row = rows[0];
  if (!row) {
    throw new Error("PRACTICE_SUBSCRIPTION_REQUIRED");
  }

  return {
    subscriptionId: row.id,
    remainingCredits: Number(row.remainingCredits ?? 0),
    usedCredits: Number(row.usedCredits ?? 0),
  };
}
