import { onboardingSteps } from "../content/onboardingSteps";
import { ONBOARDING_DEMO_CREDENTIALS, type OnboardingAction, type OnboardingResponse } from "./api";

type DemoSession = {
  authenticated: boolean;
  completedCount: number;
  failedOnce: boolean;
};

const totalSteps = onboardingSteps.length;
const sessions = new Map<string, DemoSession>();

function loadSession(key: string, initial: DemoSession) {
  try {
    const saved = sessionStorage.getItem(key);
    if (saved) return JSON.parse(saved) as DemoSession;
  } catch {
    // Keep the demo usable if the browser blocks browser storage.
  }
  return sessions.get(key) ?? initial;
}

function saveSession(key: string, session: DemoSession) {
  sessions.set(key, session);
  try {
    sessionStorage.setItem(key, JSON.stringify(session));
  } catch {
    // The current page can still use the in-memory session.
  }
}

export function respondToDemo(
  action: OnboardingAction,
  body?: Record<string, unknown>,
): OnboardingResponse {
  const url = new URL(window.location.href);
  const requestedStep = url.searchParams.get("step");
  const startStep = Number(requestedStep);
  const initialCount = requestedStep === "complete"
    ? totalSteps
    : Number.isInteger(startStep) && startStep >= 1 && startStep <= totalSteps
      ? startStep - 1
      : 0;
  const failOnce = url.searchParams.get("fail") === "once";
  const key = `treehubly:onboarding-demo:${initialCount}:${failOnce}`;
  const session = loadSession(key, {
    authenticated: !url.pathname.endsWith("/login/"),
    completedCount: initialCount,
    failedOnce: false,
  });

  if (action === "session") {
    return {
      status: 200,
      result: { success: true, authenticated: session.authenticated, previewEnabled: true },
    };
  }

  if (action === "login" || action === "logout") {
    if (action === "login" && (body?.email !== ONBOARDING_DEMO_CREDENTIALS.email
      || body?.pin !== ONBOARDING_DEMO_CREDENTIALS.pin)) {
      return { status: 422, result: { success: false, error: "El correo o el PIN son incorrectos." } };
    }
    saveSession(key, { ...session, authenticated: action === "login" });
    return { status: 200, result: { success: true } };
  }

  if (!session.authenticated) {
    return { status: 401, result: { success: false, error: "Inicia sesión." } };
  }

  if (action === "complete") {
    const step = body?.stepNumber;
    if (typeof step !== "number" || !Number.isInteger(step) || step < 1 || step > totalSteps) {
      return { status: 400, result: { success: false, error: "Paso inválido." } };
    }
    if (step > session.completedCount + 1) {
      return { status: 409, result: { success: false, error: "Completa primero el paso activo." } };
    }
    if (step === session.completedCount + 1) {
      if (failOnce && !session.failedOnce) {
        saveSession(key, { ...session, failedOnce: true });
        return {
          status: 502,
          result: { success: false, error: "Error de guardado simulado. Intenta nuevamente." },
        };
      }
      session.completedCount = step;
    }
  }

  saveSession(key, session);
  return {
    status: 200,
    result: {
      success: true,
      progress: {
        currentStep: session.completedCount === totalSteps ? null : session.completedCount + 1,
        completedCount: session.completedCount,
      },
    },
  };
}
