import { cookies } from "next/headers";
import { query } from "./pg";

const SESSION_COOKIE_NAME = "hireveri_session";

export async function getSessionIdentityId() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return null;
  }

  const { rows } = await query<{ identity_id: string }>(
    `
      select identity_id::text
      from public.auth_sessions
      where session_id = $1::uuid
        and is_active = true
        and expires_at > now()
      limit 1
    `,
    [sessionId]
  );

  return rows[0]?.identity_id ?? null;
}
