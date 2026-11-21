export const ONBOARDING_PATH = "/onboarding/";
export const ONBOARDING_LOGIN_PATH = "/onboarding/login/";
export const ONBOARDING_COMPLETE_PATH = "/onboarding/complete/";
export const ONBOARDING_DEMO_CREDENTIALS = { email: "prueba@example.com", pin: "2468" };

export type OnboardingResult =
  | {
      success: true;
      progress?: { currentStep: number | null; completedCount: number };
      authenticated?: boolean;
      previewEnabled?: boolean;
    }
  | { success: false; error: string };

export type OnboardingAction = "session" | "sync" | "login" | "logout" | "complete";
export type OnboardingResponse = { status: number; result: OnboardingResult };

export function isOnboardingDemo() {
  return import.meta.env.DEV && typeof window !== "undefined"
    && new URLSearchParams(window.location.search).get("demo") === "1";
}

export function onboardingPage(path: string) {
  return isOnboardingDemo() ? path + window.location.search : path;
}

export async function requestOnboarding(
  action: OnboardingAction,
  signal?: AbortSignal,
  body?: Record<string, unknown>,
): Promise<OnboardingResponse> {
  if (import.meta.env.DEV && isOnboardingDemo()) {
    const { respondToDemo } = await import("./demo");
    signal?.throwIfAborted();
    return respondToDemo(action, body);
  }

  const response = await fetch(`${ONBOARDING_PATH}api/index.php?action=${action}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if (!response.headers.get("Content-Type")?.includes("application/json")) {
    throw new Error("El servicio de onboarding no está disponible.");
  }

  return { status: response.status, result: (await response.json()) as OnboardingResult };
}

export function onboardingErrorMessage(cause: unknown) {
  return cause instanceof Error && !(cause instanceof TypeError)
    ? cause.message
    : "No se pudo conectar. Intenta nuevamente.";
}
