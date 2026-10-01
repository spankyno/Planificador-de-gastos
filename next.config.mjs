import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

if (process.env.NODE_ENV === "development") {
  await setupDevPlatform(); // expone el binding DB (D1 local) durante `next dev`
}

// CSP en modo "solo informe": no bloquea nada; los avisos aparecen en la consola del navegador.
// Cuando no veas avisos en un uso normal (login, cuadrante, informes), cambia la clave a
// "Content-Security-Policy" para aplicarla.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://aitors-hub-dashboard.asanchezgu.workers.dev",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://img.clerk.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.clerk.accounts.dev https://clerk-telemetry.com https://aitors-hub-dashboard.asanchezgu.workers.dev",
  "frame-src https://challenges.cloudflare.com https://*.clerk.accounts.dev",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" }, // evita clickjacking
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

/** @type {import('next').NextConfig} */
export default {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
