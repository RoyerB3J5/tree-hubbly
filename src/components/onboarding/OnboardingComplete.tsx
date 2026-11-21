import { useEffect, useRef } from "react";
import {
  ONBOARDING_LOGIN_PATH,
  ONBOARDING_PATH,
  onboardingPage,
} from "../../onboarding/api";
import { useOnboarding } from "../../onboarding/useOnboarding";
import OnboardingHeader from "./OnboardingHeader";

export default function OnboardingComplete() {
  const { state, busy, error, refreshProgress, signOut } = useOnboarding();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state.kind === "signed-out") {
      window.location.replace(onboardingPage(ONBOARDING_LOGIN_PATH));
    }
    if (state.kind === "step") {
      window.location.replace(onboardingPage(ONBOARDING_PATH));
    }
    if (state.kind === "completed") heading.current?.focus();
  }, [state.kind]);

  return (
    <>
      <OnboardingHeader busy={busy} signOut={signOut} />
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center xl:px-20">
        {state.kind === "completed" ? (
          <>
            <div className="flex w-full max-w-[720px] flex-col items-center gap-8">
              <img src="/images/icons/onboarding-complete-check.svg" alt="" width="48" height="48" className="shrink-0" />
              <h1 ref={heading} tabIndex={-1} className="max-w-[498px] outline-none text-4xl leading-[1.1] font-bold text-paragraph md:text-[52px]">
                ¡Es hora de hacer <span className="text-secondary">crecer tu negocio!</span>
              </h1>
              <p className="text-base leading-[1.5] text-paragraph">
                ¡Felicitaciones! Has completado tu onboarding. Pronto{" "}
                <span className="text-secondary">agendaremos una llamada Kickoff</span>{" "}
                con tu Account Manager para coordinar el lanzamiento de tu campaña.
              </p>
              <p className="text-base leading-[1.5] font-semibold text-paragraph">
                ¡Estamos listos para impulsar tu negocio y alcanzar grandes resultados juntos!
              </p>
            </div>
            <a
              href="/en/#questions"
              title="Enlace pendiente"
              className="mt-12 min-h-12 rounded-lg bg-secondary px-8 text-base leading-[1.5] font-semibold text-primary-2 disabled:cursor-not-allowed flex justify-center items-center"
            >
              ¿Tienes preguntas? FAQs
            </a>
          </>
        ) : error ? (
          <button type="button" onClick={refreshProgress}>Reintentar</button>
        ) : (
          <p role="status">Consultando tu progreso…</p>
        )}
        {error && <p role="alert" className="mt-6 text-sm text-red-200">{error}</p>}
      </section>
    </>
  );
}
