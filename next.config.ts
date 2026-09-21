import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Nessuno script/iframe di terze parti nel sito oltre alla mappa di Google
// in Territorio.tsx: niente Stripe.js (il checkout reindirizza a una pagina
// Stripe-hosted), niente Mapbox nonostante la variabile d'ambiente prevista,
// niente analytics. Il sito resta quindi statico/prerenderizzato: la CSP qui
// sotto non usa nonce, che richiederebbe rendering dinamico su ogni pagina
// (perdendo la cache CDN che il report di sicurezza stesso elenca come
// punto di forza). script-src richiede 'unsafe-inline' perché l'App Router
// di Next.js inietta script inline per l'hydration RSC
// (self.__next_f.push(...)) su ogni pagina, non solo per contenuti nostri —
// verificato che l'unico dangerouslySetInnerHTML del sito è il JSON-LD
// (dati di sito, non input utente) e che nessun componente renderizza HTML
// non attendibile, quindi il rischio residuo di 'unsafe-inline' qui è
// contenuto. style-src richiede 'unsafe-inline' perché framer-motion e
// next/image applicano stili via attributo style.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co;
  font-src 'self' data:;
  connect-src 'self';
  frame-src https://www.google.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
