import { createHash, randomUUID } from "crypto";
import { cookies, headers } from "next/headers";

export const DEVICE_COOKIE_NAME = "hv_device";

export type RequestOrigin = {
  ip: string | null;
  userAgent: string | null;
  deviceHash: string | null;
  issuedDeviceId: string | null;
};

function firstForwardedIp(value: string | null) {
  if (!value) return null;
  const candidate = value.split(",")[0]?.trim();
  return candidate || null;
}

/**
 * Abuse-prevention signals available from an ordinary request.
 *
 * The device signal is a first-party opaque cookie hashed with the user agent,
 * not a fingerprint. It exists so that repeated free-practice requests from one
 * browser land in review rather than being granted silently — never to block a
 * person permanently.
 */
export async function getRequestOrigin(): Promise<RequestOrigin> {
  const [headerStore, cookieStore] = await Promise.all([headers(), cookies()]);

  const ip =
    firstForwardedIp(headerStore.get("x-forwarded-for")) ||
    headerStore.get("x-real-ip") ||
    headerStore.get("cf-connecting-ip") ||
    null;
  const userAgent = headerStore.get("user-agent");

  let deviceId = cookieStore.get(DEVICE_COOKIE_NAME)?.value ?? null;
  let issuedDeviceId: string | null = null;

  if (!deviceId) {
    deviceId = randomUUID();
    issuedDeviceId = deviceId;
  }

  const deviceHash = createHash("sha256")
    .update(`${deviceId}|${userAgent ?? ""}`)
    .digest("hex")
    .slice(0, 48);

  return { ip, userAgent, deviceHash, issuedDeviceId };
}

export function applyDeviceCookie(response: Response, origin: RequestOrigin) {
  if (!origin.issuedDeviceId) return response;

  response.headers.append(
    "Set-Cookie",
    `${DEVICE_COOKIE_NAME}=${origin.issuedDeviceId}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax; HttpOnly${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`
  );

  return response;
}
