// @ts-check
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://treehubly.com",
  trailingSlash: "always",
  vite: {
    plugins: [tailwindcss()],
  },

  i18n: {
    defaultLocale: "en",
    locales: ["es", "en"],
    routing: "manual",
  },

  integrations: [react(), icon(), sitemap({
    filter: (page) => {
      const { pathname } = new URL(page);
      return pathname !== "/" && !pathname.startsWith("/onboarding/");
    },
  })],
});
