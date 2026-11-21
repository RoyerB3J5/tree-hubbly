type StepContent =
  | { kind: "video"; src: string; captions?: string }
  | { kind: "iframe"; src: string };

interface OnboardingStep {
  title: string;
  description: string;
  content?: StepContent;
}

// The order matches the GoHighLevel pipeline in public/onboarding/api/ghl.php.
export const onboardingSteps: readonly OnboardingStep[] = [
  {
    title: "Programa nuestra llamada de setup técnica",
    description:
      "Agenda tu llamada técnica para configurar el acceso a Facebook e Instagram. Conéctate a Zoom desde una computadora al momento de la llamada.",
  },
  {
    title: "Programa nuestra llamada de kickoff",
    description:
      "Tu Client Success Manager te presentará el calendario y la propuesta de marketing.",
  },
  {
    title: "Adjunta la información de tu negocio",
    description: "Comparte la información básica de tu negocio.",
  },
  {
    title: "Suscriptores de Texto/Email",
    description:
      "Compártenos tu base de suscriptores de correo electrónico o mensajes de texto si tienes una.",
  },
  {
    title: "Sube las fotos de tu negocio",
    description: "Envíanos las fotos de tu comida. Si todavía no tienes fotos, avísanos.",
  },
  {
    title: "Formulario de autorización de tarjeta de crédito",
    description:
      "Completa el formulario para autorizar un método de pago principal y uno de respaldo para tus anuncios en Facebook.",
  },
  {
    title: "Facebook & acceso a la cuenta de Ads",
    description:
      "Danos acceso de administrador. Si necesitas ayuda, puedes reservar una llamada técnica.",
  },
  {
    title: "Firma el Acuerdo de Servicio",
    description:
      "Firma el acuerdo que enviamos a tu correo con el asunto “Signature requested by Treehubly”.",
  },
];
