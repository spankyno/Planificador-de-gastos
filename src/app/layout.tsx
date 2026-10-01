import type { Metadata } from "next";
import { ClerkProvider, SignedIn } from "@clerk/nextjs";
import Nav from "@/components/Nav";
import "./globals.css";

export const runtime = "edge";

// Aplica el tema guardado (o el del sistema) antes de pintar, para evitar parpadeos
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export const metadata: Metadata = { title: "Spending Planner", description: "Planificador de gastos anuales" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es" suppressHydrationWarning>
        <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
        <body className="bg-white dark:bg-slate-950">
          <SignedIn><Nav /></SignedIn>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
