const programmeUrl = "https://treehubly.com/scheduling/programme/";

export const programmeContent = {
  seo: {
    lang: "es",
    title: "Marketing para tree service en EE. UU. | Treehubly",
    description:
      "Genera reseñas, responde leads y agenda más trabajos para tu compañía de tree service en EE. UU. con el sistema de marketing y automatización de Treehubly.",
    keywords:
      "marketing para tree service, leads para tree service, automatización de citas, seguimiento de leads, más trabajos agendados",
    image: "/images/portada.jpg",
    canonicalUrl: programmeUrl,
  },
  hero: {
    intro:
      "El sistema automatizado que usan compañías de tree service en EE. UU. para liderar su zona",
    title: "Más reseñas, más llamadas y",
    titleHighlight: "más trabajos agendados",
    description:
      "Con un Plan personalizado, sin depender de referidos no leads compartidos. Agendamos por ti; tú solo llegas a la visita",
    videoStepLabel: "PASO 1:",
    videoStepTitle: "Mira el video",
    eligibilityNote:
      "*Agenda SOLO si eres dueño de una compañía de tree service con crews operando en Estados Unidos",
  },
  booking: {
    stepLabel: "PASO 2:",
    title: "Agenda tu llamada de diagnóstico",
    helpText:
      "(30 minutos. Si no encuentras un horario disponible, escríbenos por",
    whatsappLabel: "WhatsApp aquí",
    whatsappUrl: "https://wa.me/14075023684",
  },
  footer: {
    href: "/scheduling/programme/",
    logoAlt: "Logo de Treehubly",
    copyright: "© 2026 Treehubly · Privacy",
  },
  structuredData: {
    pageName: "Marketing para compañías de tree service en Estados Unidos",
    serviceName: "Sistema de marketing para compañías de tree service",
    serviceType:
      "Marketing, seguimiento de leads y automatización de citas para empresas de tree service",
    audienceType:
      "Propietarios de compañías de tree service con equipos operativos en Estados Unidos",
  },
} as const;

export type ProgrammeContent = typeof programmeContent;
