import { middleware } from "astro:i18n";
import { defineMiddleware } from "astro:middleware";

const localize = middleware({
  prefixDefaultLocale: true,
  redirectToDefaultLocale: false,
  fallbackType: "redirect",
});

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;
  if (pathname === "/onboarding/" || pathname === "/onboarding/login/" || pathname === "/onboarding/complete/") {
    return next();
  }

  return localize(context, next);
});
