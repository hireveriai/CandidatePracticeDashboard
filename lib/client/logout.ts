import { clearVerisnovaSessionCookie, getPracticeLoginUrl } from "@/lib/client/auth-session";

const LOGOUT_TIMEOUT_MS = 1200;

function withTimeout<T>(promise: Promise<T>, timeoutMs = LOGOUT_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

function clearBrowserStorage() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.clear();
  } catch {
    // ignore
  }

  try {
    window.sessionStorage.clear();
  } catch {
    // ignore
  }
}

async function clearServerSession() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      keepalive: true,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    // Client-side cookie and storage cleanup still runs even if the network is interrupted.
  }
}

export async function logoutCandidate(redirectUrl = getPracticeLoginUrl()) {
  if (typeof window === "undefined") {
    return;
  }

  clearVerisnovaSessionCookie();
  clearBrowserStorage();

  await withTimeout(clearServerSession());

  clearVerisnovaSessionCookie();
  clearBrowserStorage();
  window.location.replace(redirectUrl);
}
