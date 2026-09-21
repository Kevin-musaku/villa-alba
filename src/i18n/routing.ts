import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["it", "en", "de", "es", "fr"],
  defaultLocale: "it",
  localePrefix: "always",
  // Secure disattivato solo in sviluppo: su http://localhost il browser
  // scarterebbe silenziosamente un cookie con Secure impostato.
  localeCookie: {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
});

export type AppLocale = (typeof routing.locales)[number];
