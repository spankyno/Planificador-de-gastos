import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { ClerkProvider, SignedIn } from "@clerk/nextjs";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { JSON_LD, SITE } from "@/lib/site";
import "./globals.css";

export const runtime = "edge";

// Aplica el tema guardado (o el del sistema) antes de pintar, para evitar parpadeos
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.fullName, template: `%s | ${SITE.fullName}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [...SITE.keywords],
  authors: [{ name: SITE.author.name, url: SITE.author.url }],
  creator: SITE.author.name,
  publisher: SITE.author.name,
  category: "finance",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  verification: { google: SITE.googleVerification },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.descriptiveTitle,
    description: SITE.description,
    images: [{ url: SITE.ogImage.url, width: SITE.ogImage.width, height: SITE.ogImage.height, alt: SITE.fullName }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.descriptiveTitle,
    description: SITE.description,
    images: [SITE.ogImage.url],
  },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#020617" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es" suppressHydrationWarning>
        <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
        <body className="flex min-h-screen flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }} />
          <SignedIn><Nav /></SignedIn>
          <div className="flex-1">{children}</div>
          <Footer />
          {/* Script de Aitor's Analytics Next js */}
          <Script
            src="https://aitors-hub-dashboard.asanchezgu.workers.dev/tracker.js"
            data-app="planificador-de-gastos"
            data-key="ak_f80f0e9a71904e32baa2f37f36e2abb6"
            strategy="afterInteractive"
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
