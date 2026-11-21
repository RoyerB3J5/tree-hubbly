import { useCallback, useEffect, useRef, useState } from "react";
import { onboardingSteps } from "../content/onboardingSteps";
import { onboardingErrorMessage, requestOnboarding, type OnboardingResult } from "./api";

export type OnboardingState =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "step"; progress: { currentStep: number; completedCount: number } }
  | { kind: "completed"; progress: { completedCount: number } };

type StepStatus = "completed" | "current" | "locked";

function getSteps(state: OnboardingState) {
  if (state.kind !== "step" && state.kind !== "completed") return [];

  return onboardingSteps.map((step, index) => {
    const number = index + 1;
    const status: StepStatus = number <= state.progress.completedCount
      ? "completed"
      : state.kind === "step" && number === state.progress.currentStep
        ? "current"
        : "locked";
    return { ...step, number, status };
  });
}

function progressState(status: number, result: OnboardingResult): OnboardingState {
  if (status === 401 && !result.success) {
    return { kind: "signed-out" };
  }

  if (!result.success) throw new Error(result.error);
  if (!result.progress) throw new Error("No se pudo obtener el progreso.");

  const { currentStep, completedCount } = result.progress;
  return currentStep === null
    ? { kind: "completed", progress: { completedCount } }
    : { kind: "step", progress: { currentStep, completedCount } };
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const activeRequest = useRef<AbortController | null>(null);

  const run = useCallback(async (operation: (signal: AbortSignal) => Promise<void>) => {
    if (activeRequest.current) return;

    const controller = new AbortController();
    activeRequest.current = controller;
    setBusy(true);
    setError("");

    try {
      await operation(controller.signal);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(onboardingErrorMessage(cause));
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setBusy(false);
      }
    }
  }, []);

  const sync = useCallback(async (signal: AbortSignal) => {
    const { status, result } = await requestOnboarding("sync", signal);
    if (!signal.aborted) setState(progressState(status, result));
  }, []);

  useEffect(() => {
    void run(sync);
    return () => {
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, [run, sync]);

  function signOut() {
    return run(async (signal) => {
      const { result } = await requestOnboarding("logout", signal, {});
      if (signal.aborted) return;
      if (!result.success) throw new Error(result.error);

      setState({ kind: "signed-out" });
    });
  }

  async function completeCurrentStep() {
    if (state.kind !== "step") return;

    return run(async (signal) => {
      const { status, result } = await requestOnboarding("complete", signal, {
        stepNumber: state.progress.currentStep,
      });
      if (!signal.aborted) setState(progressState(status, result));
    });
  }

  return {
    state,
    steps: getSteps(state),
    totalSteps: onboardingSteps.length,
    busy,
    error,
    signOut,
    completeCurrentStep,
    refreshProgress: () => run(sync),
  };
}
