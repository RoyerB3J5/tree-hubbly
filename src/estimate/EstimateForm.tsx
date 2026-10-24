import { type FormEvent, useEffect, useRef, useState } from "react";
import PhoneInput, {
  isValidPhoneNumber,
  type Country,
} from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./estimate-phone-input.css";
import { captureAttribution } from "../utils/attribution";
import {
  estimateSteps,
  type EstimateAnswers,
  type EstimateField,
} from "./config";

const DRAFT_KEY = "prestige-questions-draft-v2";
const LEGACY_DRAFT_KEY = "prestige-questions-draft";

// País que se muestra seleccionado por defecto en el selector de banderas.
// El usuario puede cambiarlo libremente antes de escribir su número.
const DEFAULT_COUNTRY: Country = "US";

// Sólo para maquetación/pruebas. Cambiar a false o eliminar este bloque antes de publicar.
const SHOW_DEVELOPMENT_CONTROLS = false;

const contentUS = {
  required: "This field is required.",
  invalidEmail: "Enter a valid email address.",
  invalidPhone: "Enter a valid phone number.",
  progressLabel: "Form progress",
  progressValue: (current: number, total: number) =>
    `Progress: step ${current} of ${total}`,
  thankYou: "Thank you",
  sending: "Sending...",
  submit: "Submit",
  next: "Next",
  sendError: "Error sending information. Please try again.",
  connectionError: "Connection error sending the form.",
};

const contentEs = {
  required: "Este campo es obligatorio.",
  invalidName: "Ingresa tu nombre y apellido.",
  invalidEmail: "Ingresa un correo electrónico válido.",
  invalidPhone: "Ingresa un número de teléfono válido.",
  progressLabel: "Progreso del formulario",
  progressValue: (current: number, total: number) =>
    `Progreso: paso ${current} de ${total}`,
  thankYou: "Gracias",
  sending: "Enviando...",
  start: "Quiero ver si mi negocio califica",
  submit: "Evaluar",
  next: "Siguiente",
  sendError: "Error al enviar la información. Intente nuevamente.",
  connectionError: "Error de conexión al enviar el formulario.",
};

const content = contentEs;

function getEntryState(): {
  answers: EstimateAnswers;
  step: number;
  hasEntry: boolean;
} {
  if (typeof window === "undefined") {
    return { answers: {}, step: 0, hasEntry: false };
  }

  const params = new URLSearchParams(window.location.search);
  const project = params.get("project") ?? undefined;
  const area = params.get("area") ?? undefined;
  const zip = params.get("zip") ?? undefined;

  return {
    answers: { servicesType: project, area, zip },
    step: 0,
    hasEntry: params.has("project") || params.has("area") || params.has("zip"),
  };
}

function readDraft(): { answers: EstimateAnswers; step: number } {
  if (typeof window === "undefined") return { answers: {}, step: 0 };
  try {
    const saved = window.sessionStorage.getItem(DRAFT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as {
        answers?: EstimateAnswers;
        step?: number;
        version?: number;
      };
      const step = Number.isInteger(parsed.step) ? (parsed.step ?? 0) : 0;

      return {
        answers: parsed.answers ?? {},
        step: Math.min(Math.max(step, 0), estimateSteps.length - 1),
      };
    }

    const legacySaved = window.sessionStorage.getItem(LEGACY_DRAFT_KEY);
    if (!legacySaved) return { answers: {}, step: 0 };

    const legacyAnswers =
      (JSON.parse(legacySaved) as { answers?: EstimateAnswers }).answers ?? {};
    const legacyName = [legacyAnswers.firstName, legacyAnswers.lastName]
      .filter(Boolean)
      .join(" ");
    const answers: EstimateAnswers = {
      name: legacyAnswers.name || legacyName,
      email: legacyAnswers.email,
      phone: legacyAnswers.phone,
      servicesType: legacyAnswers.servicesType,
      area: legacyAnswers.area,
      zip: legacyAnswers.zip,
    };

    window.sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ version: 2, answers, step: 0 }),
    );
    window.sessionStorage.removeItem(LEGACY_DRAFT_KEY);
    return { answers, step: 0 };
  } catch {
    return { answers: {}, step: 0 };
  }
}

function validateField(field: EstimateField, value: string | undefined) {
  if (!value?.trim()) return content.required;
  if (field.id === "name" && value.trim().split(/\s+/).length < 2) {
    return content.invalidName;
  }
  if (field.type === "email" && !/^\S+@\S+\.\S+$/.test(value)) {
    return content.invalidEmail;
  }
  if (field.type === "tel" && !isValidPhoneNumber(value)) {
    return content.invalidPhone;
  }
  return undefined;
}

function getCurrencyDecimalIndex(value: string, previousValue?: string) {
  const periodIndex = value.indexOf(".");
  if (periodIndex >= 0) return periodIndex;

  const commaIndex = value.lastIndexOf(",");
  const digitsAfterComma = value
    .slice(commaIndex + 1)
    .replace(/\D/g, "").length;
  const currentCommaCount = value.match(/,/g)?.length ?? 0;
  const previousCommaCount = previousValue?.match(/,/g)?.length ?? 0;
  const commaWasAdded =
    !previousValue || currentCommaCount > previousCommaCount;

  return commaIndex >= 0 && digitsAfterComma <= 2 && commaWasAdded
    ? commaIndex
    : -1;
}

function formatUsdCurrency(
  value: string | undefined,
  complete = false,
  previousValue?: string,
) {
  const input = (value ?? "").trim().replace(/[$\s]/g, "");
  const decimalIndex = getCurrencyDecimalIndex(input, previousValue);
  const normalized =
    decimalIndex < 0
      ? input.replace(/,/g, "")
      : `${input.slice(0, decimalIndex).replace(/,/g, "")}.${input
          .slice(decimalIndex + 1)
          .replace(/,/g, "")}`;
  const hasDecimal = normalized.includes(".");
  if (!/\d/.test(normalized) && !hasDecimal) return "";

  const [integerPart = "", ...fractionParts] = normalized.split(".");
  const integerDigits = integerPart.replace(/\D/g, "");
  const integer = integerDigits.replace(/^0+(?=\d)/, "") || "0";
  const fraction = fractionParts.join("").replace(/\D/g, "").slice(0, 2);
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formattedFraction = complete ? fraction.padEnd(2, "0") : fraction;

  return `$${formattedInteger}${complete || hasDecimal ? `.${formattedFraction}` : ""}`;
}

function getUsdCaretPosition(
  formatted: string,
  integerDigitsBefore: number,
  fractionDigitsBefore: number,
  commasBefore: number,
  decimalBefore: boolean,
) {
  let integerDigitsSeen = 0;
  let fractionDigitsSeen = 0;
  let commasSeen = 0;
  let decimalSeen = false;
  const integerTarget = integerDigitsBefore || (decimalBefore ? 1 : 0);

  for (let index = 0; index < formatted.length; index += 1) {
    const character = formatted[index];
    if (character === ",") commasSeen += 1;
    else if (character === ".") decimalSeen = true;
    else if (/\d/.test(character)) {
      if (decimalSeen) fractionDigitsSeen += 1;
      else integerDigitsSeen += 1;
    }

    const caretMatches = decimalBefore
      ? decimalSeen &&
        integerDigitsSeen === integerTarget &&
        fractionDigitsSeen === fractionDigitsBefore
      : !decimalSeen && integerDigitsSeen === integerTarget;

    if (caretMatches && commasSeen >= commasBefore) return index + 1;
  }

  return formatted.length;
}

export default function EstimateForm({
  fullScreen = true,
}: {
  fullScreen?: boolean;
}) {
  const [answers, setAnswers] = useState<EstimateAnswers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submissionInProgress = useRef(false);

  const step = estimateSteps[stepIndex];
  const isFinalStep = stepIndex === estimateSteps.length - 1;
  const isChoiceOnlyStep =
    step.fields.length > 0 &&
    step.fields.every((field) => field.type === "choice");
  const progressStepTotal = estimateSteps.length;
  const currentProgressStep = stepIndex + 1;
  const progressPercentage = (currentProgressStep / progressStepTotal) * 100;

  useEffect(() => {
    const entry = getEntryState();
    const draft = readDraft();
    const initialState = entry.hasEntry ? entry : draft;
    const initialAnswers = { ...initialState.answers };

    if (initialAnswers.monthlyRevenue) {
      initialAnswers.monthlyRevenue = formatUsdCurrency(
        initialAnswers.monthlyRevenue,
        true,
      );
    }

    setAnswers(initialAnswers);
    setStepIndex(initialState.step ?? 0);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    window.sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ version: 2, answers, step: stepIndex }),
    );
  }, [answers, stepIndex, isInitialized]);

  function setAnswer(id: EstimateField["id"], value: string) {
    setAnswers((current) => ({ ...current, [id]: value }));
    setErrors((current) => ({ ...current, [id]: undefined }));
  }

  function selectChoice(id: EstimateField["id"], value: string) {
    if (isSubmitting || submissionInProgress.current) return;

    const nextAnswers = { ...answers, [id]: value };
    const nextStepIndex = isFinalStep
      ? stepIndex
      : Math.min(stepIndex + 1, estimateSteps.length - 1);

    setAnswers(nextAnswers);
    setErrors((current) => ({ ...current, [id]: undefined }));
    window.sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ version: 2, answers: nextAnswers, step: nextStepIndex }),
    );

    const allChoiceFieldsAnswered = step.fields.every((field) =>
      Boolean(nextAnswers[field.id]),
    );
    if (!isChoiceOnlyStep || !allChoiceFieldsAnswered) return;

    if (isFinalStep) {
      void submitAnswers(nextAnswers);
    } else {
      setStepIndex(nextStepIndex);
    }
  }

  function validateStep(answersToValidate = answers) {
    if (SHOW_DEVELOPMENT_CONTROLS) {
      setErrors({});
      return true;
    }

    const nextErrors: Partial<Record<string, string>> = {};
    step.fields.forEach((field) => {
      const error = validateField(field, answersToValidate[field.id]);
      if (error) nextErrors[field.id] = error;
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goToPreviousStep() {
    setErrors({});
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function goToNextStep() {
    if (!validateStep()) return;
    setStepIndex((current) => Math.min(current + 1, estimateSteps.length - 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isFinalStep) {
      goToNextStep();
      return;
    }

    await submitAnswers(answers);
  }
  async function submitAnswers(answersToSubmit: EstimateAnswers) {
    window.location.href = "/scheduling/calendar";
  }
  {
    /*async function submitAnswers(answersToSubmit: EstimateAnswers) {
    if (submissionInProgress.current || !validateStep(answersToSubmit)) return;

    submissionInProgress.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    const payloadAnswers = { ...answersToSubmit };
    if (payloadAnswers.monthlyRevenue) {
      payloadAnswers.monthlyRevenue = formatUsdCurrency(
        payloadAnswers.monthlyRevenue,
        true,
      );
    }

    const submittedAt = new Date().toISOString();
    const payload = {
      ...payloadAnswers,
      submittedAt,
      submitted_at: submittedAt,
      ...captureAttribution(window),
    };

    console.log("[EstimateForm] Enviando datos a /api/enviar-lead:", payload);

    try {
      const response = await fetch("/api/enviar-lead.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        console.log("[EstimateForm] Datos enviados exitosamente:", {
          status: response.status,
          responseData,
          sentPayload: payload,
        });

        try {
          window.sessionStorage.removeItem(DRAFT_KEY);
          window.sessionStorage.removeItem(LEGACY_DRAFT_KEY);
          window.sessionStorage.setItem(
            "prestige-pending-lead-transition",
            "1",
          );
        } catch {
          // The form should still continue if browser storage is unavailable.
        }
        setSubmitted(true);

        // Send the user directly to the appointment calendar after a successful submission.
        window.location.href = "/scheduling/calendar";
      } else {
        console.error("[EstimateForm] Error al enviar los datos:", {
          status: response.status,
          error: responseData,
          sentPayload: payload,
        });
        setSubmitError(content.sendError);
      }
    } catch (error) {
      console.error("[EstimateForm] Excepción al realizar la petición:", {
        error,
        sentPayload: payload,
      });
      setSubmitError(content.connectionError);
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  } */
  }
  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`estimate-form relative z-[3] flex w-full flex-col items-center pb-8 pt-20 md:pt-16 text-white md:pb-10 md:pt-30 gap-12 md:gap-8 ${fullScreen ? "min-h-screen px-5 md:px-8" : "px-0"}`}
    >
      <div className="container-full flex flex-col justify-center items-end">
        <div className="mb-2.25 flex items-center justify-start text-[16px] font-normal leading-[100%] text-white">
          <span className="sr-only">{content.progressLabel}</span>
        </div>
        <div
          className="h-[9px] w-full overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-label={content.progressValue(
            currentProgressStep,
            progressStepTotal,
          )}
          aria-valuemin={1}
          aria-valuemax={progressStepTotal}
          aria-valuenow={currentProgressStep}
        >
          <div
            className="h-full rounded-full bg-secondary transition-[width] duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center w-full md:w-auto">
        {submitted ? (
          <div className="text-center" role="status">
            <h1 className="font-georgia text-[26px] text-secondary md:text-[32px]">
              {content.thankYou}
            </h1>
          </div>
        ) : (
          <article className="flex w-full flex-col items-center gap-8">
            <header className=" text-center ">
              <h1 className="text-[24px] leading-[183%]  text-secondary text-center font-semibold">
                {step.title}
              </h1>
              {step.description && (
                <p className="mt-6 text-center text-[15px] leading-[1.35] text-white">
                  {step.description}
                </p>
              )}
            </header>

            <div
              className={`grid w-full grid-cols-1 justify-center ${stepIndex === 0 ? "gap-5" : "gap-3"}`}
            >
              {step.fields.map((field) => {
                if (field.type === "choice") {
                  return (
                    <fieldset key={field.id} className="w-full md:w-[380px]">
                      <legend className="sr-only">{field.label}</legend>
                      <div className="grid gap-1.5 md:gap-2 w-full md:w-auto">
                        {field.options?.map((option) => {
                          const selected = answers[field.id] === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              disabled={isSubmitting}
                              aria-pressed={selected}
                              onClick={() =>
                                selectChoice(field.id, option.value)
                              }
                              className={`w-full rounded-lg border-[1.5px] p-6 text-center text-[18px] md:text-[16px] font-normal text-white transition leading-[100%] cursor-pointer ${
                                selected
                                  ? "border-secondary bg-[#041A2A] shadow-[0_18px_5px_0_rgba(0, 0, 0, 0.00), 0_11px_5px_0_rgba(0, 0, 0, 0.02), 0_6px_4px_0_rgba(0, 0, 0, 0.08), 0_3px_3px_0_rgba(0, 0, 0, 0.13), 0_1px_2px_0 rgba(0, 0, 0, 0.15)]"
                                  : "border-[#263A4B] bg-[#041A2A] hover:border-white/60"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                      {errors[field.id] && (
                        <p
                          role="alert"
                          className="mt-2 text-center text-xs text-secondary"
                        >
                          {errors[field.id]}
                        </p>
                      )}
                    </fieldset>
                  );
                }

                if (field.type === "select") {
                  return (
                    <label
                      key={field.id}
                      className={`grid ${stepIndex === 0 ? "gap-2" : "gap-1"} w-[calc(100vw-2rem)] md:w-[400px]`}
                    >
                      <span className="text-[14px] leading-[1.2] text-white">
                        {field.label}
                      </span>
                      <select
                        id={field.id}
                        name={field.id}
                        value={answers[field.id] ?? ""}
                        onChange={(event) =>
                          setAnswer(field.id, event.target.value)
                        }
                        aria-invalid={Boolean(errors[field.id])}
                        aria-describedby={
                          errors[field.id] ? `${field.id}-error` : undefined
                        }
                        className="w-full rounded-lg border border-[#E3E3E3] bg-black/50 px-4 py-4 text-[16px] text-white outline-none focus:border-secondary font-normal leading-normal"
                      >
                        <option value="" disabled>
                          Selecciona una opción
                        </option>
                        {field.options?.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            className="bg-[#0A0A0A] text-white"
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors[field.id] && (
                        <span
                          id={`${field.id}-error`}
                          role="alert"
                          className="text-xs text-secondary"
                        >
                          {errors[field.id]}
                        </span>
                      )}
                    </label>
                  );
                }

                if (field.type === "tel") {
                  return (
                    <label
                      key={field.id}
                      className={`grid ${stepIndex === 0 ? "gap-3" : "gap-1"} w-[calc(100vw-2rem)] md:w-[400px]`}
                    >
                      <span
                        className={
                          stepIndex === 0
                            ? "text-[16px] leading-[1.2] text-white"
                            : "sr-only"
                        }
                      >
                        {field.label}
                      </span>
                      <PhoneInput
                        id={field.id}
                        name={field.id}
                        placeholder={field.placeholder}
                        autoComplete={field.autocomplete}
                        international
                        defaultCountry={DEFAULT_COUNTRY}
                        value={answers[field.id] as string | undefined}
                        onChange={(value) => setAnswer(field.id, value ?? "")}
                        aria-invalid={Boolean(errors[field.id])}
                        aria-describedby={
                          errors[field.id] ? `${field.id}-error` : undefined
                        }
                        className="estimate-phone-input"
                      />
                      {errors[field.id] && (
                        <span
                          id={`${field.id}-error`}
                          role="alert"
                          className="text-xs text-secondary"
                        >
                          {errors[field.id]}
                        </span>
                      )}
                    </label>
                  );
                }

                return (
                  <label
                    key={field.id}
                    className={`grid ${stepIndex === 0 ? "gap-3" : "gap-1"} w-full md:w-auto`}
                  >
                    <span
                      className={
                        stepIndex === 0
                          ? "text-[16px] leading-[1.2] text-white"
                          : "sr-only"
                      }
                    >
                      {field.label}
                    </span>
                    <input
                      id={field.id}
                      name={field.id}
                      type={field.id === "monthlyRevenue" ? "text" : field.type}
                      inputMode={
                        field.id === "monthlyRevenue" ? "decimal" : undefined
                      }
                      placeholder={field.placeholder}
                      autoComplete={field.autocomplete}
                      value={
                        field.id === "monthlyRevenue"
                          ? formatUsdCurrency(answers[field.id])
                          : (answers[field.id] ?? "")
                      }
                      onChange={(event) => {
                        if (field.id !== "monthlyRevenue") {
                          setAnswer(field.id, event.target.value);
                          return;
                        }

                        const input = event.currentTarget;
                        const cursor =
                          input.selectionStart ?? input.value.length;
                        const textBeforeCursor = input.value.slice(0, cursor);
                        const previousRevenue = answers.monthlyRevenue;
                        const decimalIndex = getCurrencyDecimalIndex(
                          input.value,
                          previousRevenue,
                        );
                        const decimalBefore =
                          decimalIndex >= 0 && cursor > decimalIndex;
                        const integerPart = input.value.slice(
                          0,
                          decimalIndex >= 0 && decimalBefore
                            ? decimalIndex
                            : cursor,
                        );
                        const integerDigitsBefore = integerPart.replace(
                          /\D/g,
                          "",
                        ).length;
                        const fractionDigitsBefore = decimalBefore
                          ? input.value
                              .slice(decimalIndex + 1, cursor)
                              .replace(/\D/g, "").length
                          : 0;
                        const commasBefore = Math.max(
                          0,
                          (textBeforeCursor.match(/,/g)?.length ?? 0) -
                            (decimalBefore && input.value[decimalIndex] === ","
                              ? 1
                              : 0),
                        );
                        const formatted = formatUsdCurrency(
                          input.value,
                          false,
                          previousRevenue,
                        );

                        setAnswer(field.id, formatted);
                        requestAnimationFrame(() => {
                          const nextCursor = getUsdCaretPosition(
                            formatted,
                            integerDigitsBefore,
                            fractionDigitsBefore,
                            commasBefore,
                            decimalBefore,
                          );
                          input.setSelectionRange(nextCursor, nextCursor);
                        });
                      }}
                      onBlur={(event) => {
                        if (field.id === "monthlyRevenue") {
                          setAnswer(
                            field.id,
                            formatUsdCurrency(event.currentTarget.value, true),
                          );
                        }
                      }}
                      aria-invalid={Boolean(errors[field.id])}
                      aria-describedby={
                        errors[field.id] ? `${field.id}-error` : undefined
                      }
                      className="w-[calc(100vw-2rem)] md:w-[400px] rounded-lg border border-[#E3E3E3] bg-black/50 px-4 py-4 text-[16px] text-white outline-none placeholder:text-white/45 focus:border-secondary font-normal leading-normal"
                    />
                    {errors[field.id] && (
                      <span
                        id={`${field.id}-error`}
                        role="alert"
                        className="text-xs text-secondary"
                      >
                        {errors[field.id]}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            {submitError && (
              <p
                role="alert"
                className="text-center text-sm text-secondary font-medium"
              >
                {submitError}
              </p>
            )}

            {(!isChoiceOnlyStep || isFinalStep) && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-[18px] w-full md:w-auto md:px-12 bg-secondary rounded-[14px] flex justify-center items-center gap-2 text-[16px] leading-[100%] tracking-[1.44px] uppercase text-[#0A0A0A] font-medium transition-all duration-300 ease-in-out hover:translate-y-[-3px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? content.sending
                  : isFinalStep
                    ? content.submit
                    : content.next}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M15.575 9.24098C15.6735 9.24104 15.771 9.26051 15.8619 9.29826C15.9529 9.33601 16.0355 9.39131 16.1051 9.461C16.1747 9.53069 16.2299 9.61341 16.2676 9.70443C16.3052 9.79545 16.3245 9.89299 16.3245 9.99148C16.3244 10.09 16.3049 10.1875 16.2672 10.2785C16.2294 10.3694 16.1741 10.4521 16.1044 10.5217C16.0347 10.5913 15.952 10.6464 15.861 10.6841C15.77 10.7217 15.6725 10.741 15.574 10.741L15.575 9.24098ZM14.4445 9.99048L14.4445 9.24048L14.445 9.24048L14.4445 9.99048ZM9.42596 10.7405C9.22705 10.7405 9.03629 10.6615 8.89563 10.5208C8.75498 10.3802 8.67596 10.1894 8.67596 9.99048C8.67596 9.79157 8.75498 9.6008 8.89563 9.46015C9.03629 9.3195 9.22705 9.24048 9.42596 9.24048L9.42596 10.7405ZM9.41671 9.24048C9.61563 9.24048 9.80639 9.3195 9.94704 9.46015C10.0877 9.6008 10.1667 9.79157 10.1667 9.99048C10.1667 10.1894 10.0877 10.3802 9.94704 10.5208C9.80639 10.6615 9.61563 10.7405 9.41671 10.7405L9.41671 9.24048ZM3.99996 10.7405C3.80105 10.7405 3.61029 10.6615 3.46963 10.5208C3.32898 10.3802 3.24996 10.1894 3.24996 9.99048C3.24996 9.79157 3.32898 9.6008 3.46963 9.46015C3.61029 9.3195 3.80105 9.24048 3.99996 9.24048L3.99996 10.7405ZM15.574 10.741L15.5552 10.741L15.556 9.24098L15.575 9.24098L15.574 10.741ZM15.5552 10.741L15.3327 10.741L15.334 9.24098L15.556 9.24098L15.5552 10.741ZM15.3327 10.741L15.1107 10.741L15.1117 9.24098L15.334 9.24098L15.3327 10.741ZM15.1107 10.741L14.8882 10.7407L14.8895 9.24073L15.1117 9.24098L15.1107 10.741ZM14.8882 10.7407L14.6662 10.7405L14.6672 9.24048L14.8895 9.24073L14.8882 10.7407ZM14.6662 10.7405L14.444 10.7405L14.445 9.24048L14.6672 9.24048L14.6662 10.7405ZM14.4445 10.7405L9.42596 10.7405L9.42596 9.24048L14.4445 9.24048L14.4445 10.7405ZM9.41671 10.7405L3.99996 10.7405L3.99996 9.24048L9.41671 9.24048L9.41671 10.7405Z"
                    fill="black"
                  />
                  <path
                    d="M10.2224 3.77759L15.5164 9.07184C15.6383 9.19372 15.735 9.33841 15.801 9.49766C15.8669 9.65691 15.9009 9.82759 15.9009 9.99996C15.9009 10.1723 15.8669 10.343 15.801 10.5023C15.735 10.6615 15.6383 10.8062 15.5164 10.9281L10.2222 16.2221"
                    stroke="black"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            )}
          </article>
        )}
      </div>

      {SHOW_DEVELOPMENT_CONTROLS && !submitted && (
        <nav aria-label="Controles de desarrollo" className="flex gap-2">
          <button
            type="button"
            onClick={goToPreviousStep}
            disabled={stepIndex === 0}
            className="rounded border border-white/30 bg-black/25 px-3 py-1.5 text-[10px] text-white/80 transition hover:border-secondary disabled:cursor-not-allowed disabled:opacity-35"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={goToNextStep}
            disabled={isFinalStep}
            className="rounded border border-white/30 bg-black/25 px-3 py-1.5 text-[10px] text-white/80 transition hover:border-secondary disabled:cursor-not-allowed disabled:opacity-35"
          >
            Next →
          </button>
        </nav>
      )}
    </form>
  );
}
