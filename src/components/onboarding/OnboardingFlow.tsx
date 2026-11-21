import { useEffect, useRef } from "react";
import { AiOutlineCheck, AiOutlineInfoCircle } from "react-icons/ai";
import {
  ONBOARDING_COMPLETE_PATH,
  ONBOARDING_LOGIN_PATH,
  onboardingPage,
} from "../../onboarding/api";
import { useOnboarding } from "../../onboarding/useOnboarding";
import OnboardingHeader from "./OnboardingHeader";

export default function OnboardingFlow() {
  const {
    state,
    steps,
    totalSteps,
    busy,
    error,
    signOut,
    completeCurrentStep,
    refreshProgress,
  } = useOnboarding();
  const heading = useRef<HTMLHeadingElement>(null);
  const progress = state.kind === "step" ? state.progress : null;
  const currentStep = progress?.currentStep;
  const step = currentStep === undefined ? undefined : steps[currentStep - 1];

  useEffect(() => {
    if (state.kind === "signed-out") {
      window.location.replace(onboardingPage(ONBOARDING_LOGIN_PATH));
    }
    if (state.kind === "completed") {
      window.location.replace(onboardingPage(ONBOARDING_COMPLETE_PATH));
    }
    if (state.kind === "step") heading.current?.focus();
  }, [state.kind, currentStep]);

  return (
    <>
      <OnboardingHeader busy={busy} signOut={signOut} flow />
      <section className="mx-auto w-full max-w-[1440px] px-6 py-14 xl:px-20">
        {state.kind === "loading" && (
          <div>
            <h1>Onboarding</h1>
            {error ? (
              <button type="button" onClick={refreshProgress}>Reintentar</button>
            ) : (
              <p role="status">Consultando tu progreso…</p>
            )}
          </div>
        )}
        {state.kind === "signed-out" && <p role="status">Abriendo el inicio de sesión…</p>}
        {state.kind === "completed" && <p role="status">Abriendo la confirmación…</p>}

        {progress && step && (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,738fr)_minmax(0,519fr)] lg:gap-6">
            <div className="flex min-w-0 flex-col gap-8">
              <div className="flex min-h-[30px] flex-wrap items-center gap-4">
                <span className="flex shrink-0 items-center gap-1 rounded-full border border-secondary bg-secondary/10 px-4 py-2.5 text-sm leading-[1.5] font-semibold text-secondary">
                  <span aria-hidden="true" className="size-1 rounded-full bg-secondary" />
                  Paso {String(currentStep).padStart(2, "0")}
                </span>
                <h1 ref={heading} tabIndex={-1} className="outline-none text-2xl leading-[1.4] font-bold text-paragraph">
                  {step.title}
                </h1>
              </div>

              <div
                className="aspect-video w-full rounded-lg bg-[#e5e5e5]"
                aria-label="Contenido pendiente de integración"
              />

              <div className="flex items-center gap-2 rounded-lg bg-primary p-6 text-sm leading-[1.5] text-paragraph">
                <AiOutlineInfoCircle aria-hidden="true" className="size-5 shrink-0 text-secondary" />
                <p>{step.description}</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-col item-start md:items-end gap-[38px]">
              <div className="flex w-48 flex-col gap-2 text-sm leading-[1.5]">
                <div className="flex justify-between">
                  <span>Progreso</span>
                  <span className="text-secondary">
                    {Math.round(progress.completedCount / totalSteps * 100)}%
                  </span>
                </div>
                <progress
                  aria-label="Progreso del onboarding"
                  className="onboarding-progress h-1.5 w-full overflow-hidden rounded-full"
                  value={progress.completedCount}
                  max={totalSteps}
                />
              </div>

              <aside className="w-full rounded-2xl bg-primary px-6 pt-8 pb-10">
                <p className="text-sm leading-[1.5] text-[#5d6871]">RESUMEN DEL ONBOARDING</p>
                <div className="mt-3 flex items-center gap-2 text-sm leading-[1.5]">
                  <span aria-hidden="true" className="h-4 w-1.5 rounded-full bg-secondary" />
                  <span>PASOS</span>
                  <span className="rounded-full bg-secondary/10 px-2 py-1 text-secondary">
                    {progress.currentStep} de {totalSteps}
                  </span>
                </div>

                <ol className="mt-5 flex flex-col gap-4">
                  {steps.map((item) => (
                    <li
                      key={item.number}
                      aria-current={item.status === "current" ? "step" : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-lg border px-2 py-2 text-sm leading-[1.5] ${
                        item.status === "current"
                          ? "border-secondary bg-secondary/10 text-paragraph"
                          : item.status === "locked"
                            ? "border-transparent text-[#5d6871]"
                            : "border-transparent text-paragraph"
                      }`}
                    >
                      <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs ${
                        item.status === "current"
                          ? "border-secondary bg-secondary font-bold text-primary-2"
                          : item.status === "locked"
                            ? "border-[#1e293b] bg-[#0f172a]/80 text-[#5d6871]"
                            : "border-[#334155] bg-[#1e293b] text-[#8f979d]"
                      }`}>
                        {item.number}
                      </span>
                      <span className="min-w-0 flex-1">{item.title}</span>
                      {item.status === "completed" && (
                        <AiOutlineCheck aria-label="Completado" className="size-5 shrink-0 text-secondary" />
                      )}
                      {item.status === "current" && (
                        <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-secondary" />
                      )}
                    </li>
                  ))}
                </ol>

                <div className="mt-5 flex flex-col md:flex-row flex-wrap gap-4">
                  <button
                    type="button"
                    disabled
                    title="Enlace pendiente"
                    className="min-h-12 flex-1 rounded-lg bg-secondary px-4 text-base leading-[1.5] font-semibold text-primary-2 disabled:cursor-not-allowed"
                  >
                    Agendar llamada
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={completeCurrentStep}
                    className="min-h-12 flex-1 rounded-lg border border-[#5d6871] px-4 text-base leading-[1.5] font-semibold text-paragraph disabled:opacity-50"
                  >
                    {busy ? "Procesando…" : "Siguiente paso"}
                  </button>
                </div>
              </aside>
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="mt-6 text-sm text-red-200">
            <p>{error}</p>
            {progress && <button type="button" onClick={refreshProgress}>Actualizar progreso</button>}
          </div>
        )}
      </section>
    </>
  );
}
