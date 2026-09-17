import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["it", "en", "de", "es", "fr"],
  defaultLocale: "it",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
