import type { Metadata } from "next";
import { ClerkProvider, SignedIn } from "@clerk/nextjs";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = { title: "Spending Planner", description: "Planificador de gastos anuales" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className="bg-white dark:bg-slate-950">
          <SignedIn><Nav /></SignedIn>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
