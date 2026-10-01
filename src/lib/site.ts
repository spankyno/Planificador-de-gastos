// Datos del sitio: una sola fuente para metadatos, JSON-LD, footer, sitemap y robots.
export const SITE = {
  name: "Planificador de Gastos",
  altName: "Spending Planner",
  fullName: "Planificador de Gastos - Spending Planner",
  descriptiveTitle: "Planificador de Gastos - Spending Planner | Previsión anual de gastos por familias y meses",
  url: "https://planificador-de-gastos.pages.dev",
  description:
    "Planificador de gastos anuales gratuito: cuadrante por meses y familias, previsión editable, informes con gráficos y comparativa interanual de tus gastos.",
  keywords: [
    "planificador de gastos", "previsión de gastos anual", "presupuesto anual", "control de gastos",
    "gastos fijos variables discrecionales", "comparativa interanual de gastos", "planificación financiera personal",
    "cuadrante de gastos", "spending planner",
  ],
  author: { name: "Aitor Sánchez Gutiérrez", url: "https://aitorsanchez.pages.dev" },
  links: {
    blog: "https://aitorsanchez.pages.dev",
    hub: "https://aitorhub.vercel.app",
    contact: "https://aitorsanchez.pages.dev/contacto",
  },
  googleVerification: "fK2gZcSYwHHPqDFWdIB5WD1eVONqa6kwIFqkRDRyX4g",
  ogImage: { url: "/og-image.png", width: 1200, height: 630 }, // ajusta width/height si tu imagen mide otra cosa
} as const;

export const FEATURES = [
  "Cuadrante anual por meses con familias de gasto colapsables y totales automáticos",
  "Previsión editable con actualización instantánea y periodificación en varios meses",
  "Clasificación de cada gasto como fijo, variable o discrecional",
  "Informes por tipo, familia, gasto y mes, en tabla y en gráfico, con desglose por familia",
  "Comparativa interanual con variación en importe y en porcentaje",
  "Exportación a CSV, moneda por usuario y tema claro y oscuro",
] as const;

export const STACK = [
  { name: "Next.js 15", role: "Framework (App Router, edge runtime)" },
  { name: "React 19 y TypeScript", role: "Interfaz y tipado" },
  { name: "Tailwind CSS", role: "Estilos y modo oscuro" },
  { name: "Cloudflare Pages", role: "Alojamiento en el edge" },
  { name: "Cloudflare D1 y Drizzle ORM", role: "Base de datos SQLite y acceso tipado" },
  { name: "Clerk", role: "Autenticación de usuarios" },
  { name: "Recharts", role: "Gráficos e informes" },
  { name: "Lucide React", role: "Iconos" },
] as const;

export const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.fullName,
      description: SITE.description,
      inLanguage: "es-ES",
      publisher: { "@id": `${SITE.url}/#author` },
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE.url}/#app`,
      name: SITE.name,
      alternateName: SITE.altName,
      url: SITE.url,
      description: SITE.description,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      browserRequirements: "Requiere JavaScript",
      inLanguage: "es-ES",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      featureList: [...FEATURES],
      author: { "@id": `${SITE.url}/#author` },
    },
    {
      "@type": "Person",
      "@id": `${SITE.url}/#author`,
      name: SITE.author.name,
      url: SITE.links.blog,
      sameAs: [SITE.links.blog, SITE.links.hub],
      contactPoint: { "@type": "ContactPoint", contactType: "customer support", url: SITE.links.contact, availableLanguage: ["es"] },
    },
  ],
};
