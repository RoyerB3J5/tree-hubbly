export const programmeContent = {
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

} as const;

export type ProgrammeContent = typeof programmeContent;
