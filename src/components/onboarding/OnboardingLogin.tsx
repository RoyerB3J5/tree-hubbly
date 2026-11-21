import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ONBOARDING_DEMO_CREDENTIALS,
  ONBOARDING_PATH,
  isOnboardingDemo,
  onboardingErrorMessage,
  onboardingPage,
  requestOnboarding,
} from "../../onboarding/api";

export default function OnboardingLogin() {
  const [previewEnabled, setPreviewEnabled] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const demoCredentials =
    import.meta.env.DEV && isOnboardingDemo()
      ? ONBOARDING_DEMO_CREDENTIALS
      : undefined;

  const checkSession = useCallback(async (signal?: AbortSignal) => {
    setError("");
    try {
      const { result } = await requestOnboarding("session", signal);
      if (signal?.aborted) return;
      if (!result.success) throw new Error(result.error);
      if (result.authenticated && !isOnboardingDemo()) {
        window.location.replace(onboardingPage(ONBOARDING_PATH));
        return;
      }
      setPreviewEnabled(result.previewEnabled === true);
    } catch (cause) {
      if (!signal?.aborted) setError(onboardingErrorMessage(cause));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void checkSession(controller.signal);
    return () => controller.abort();
  }, [checkSession]);

  async function signIn(body: Record<string, unknown>) {
    if (submitting) return;

    setError("");
    setSubmitting(true);
    try {
      const { result } = await requestOnboarding("login", undefined, body);
      if (!result.success) throw new Error(result.error);
      window.location.replace(onboardingPage(ONBOARDING_PATH));
    } catch (cause) {
      setError(onboardingErrorMessage(cause));
      setSubmitting(false);
    }
  }

  function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void signIn({
      email: String(fields.get("email") ?? ""),
      pin: String(fields.get("pin") ?? ""),
    });
  }

  return (
    <section className="onboarding-login">
      <img src="/images/logo.svg" alt="Treehubly" width="164" height="33" />
      <div className="bg-paragraph px-6 py-8 flex flex-col justify-center items-start gap-8 rounded-lg text-primary">
        <div className="flex flex-col justify-center items-start gap-6">
          <h1 className="body-lg">Login</h1>
          <p className="body-md">
            Enter your credentials to access your dashboard.
          </p>
        </div>

        {previewEnabled === null &&
          (error ? (
            <button type="button" onClick={() => void checkSession()}>
              Reintentar
            </button>
          ) : (
            <p role="status">Consultando el acceso…</p>
          ))}
        {previewEnabled === false && (
          <p>El acceso al onboarding todavía no está habilitado.</p>
        )}
        {previewEnabled && (
          <form
            onSubmit={handleSignIn}
            className="flex flex-col justify-center items-start gap-6 w-full"
          >
            <label className="flex flex-col justify-center items-start gap-2 w-full">
              <span className="body-md">Email</span>
              <input
                name="email"
                type="email"
                autoComplete="username"
                placeholder="name@company.com"
                defaultValue={demoCredentials?.email}
                maxLength={254}
                required
                className="w-full md:w-[580px] p-4 border rounded-lg border-[#B9B9B9] flex justify-start items-center placeholder:text-[#B9B9B9] text-primary body-md outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-all duration-200"
              />
            </label>
            <label className="flex flex-col justify-center items-start gap-2 w-full">
              <span className="body-md">PIN</span>
              <input
                name="pin"
                type="password"
                autoComplete="current-password"
                defaultValue={demoCredentials?.pin}
                minLength={4}
                maxLength={128}
                required
                className="w-full md:w-[580px] p-4 border rounded-lg border-[#B9B9B9] flex justify-start items-center placeholder:text-[#B9B9B9] text-primary body-md outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-all duration-200"
              />
            </label>
            <button
              className="onboarding-button w-full mt-2"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Ingresando…" : "Sign in"}
            </button>
          </form>
        )}
        <div className="w-full h-[1px] bg-[#E8E8E8]"></div>
        <p className="body-md text-center w-full">
          Don't have an account?
          <a
            href="https://wa.me/14075023684"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold"
          >
            Contact Support
          </a>
        </p>
        {error && <p role="alert">{error}</p>}
      </div>
    </section>
  );
}
