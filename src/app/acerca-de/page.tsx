import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import { FEATURES, SITE, STACK } from "@/lib/site";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Acerca de",
  description: "Qué es Planificador de Gastos, sus características, el stack tecnológico con el que está construido y quién lo ha creado.",
  alternates: { canonical: "/acerca-de" },
  openGraph: { url: `${SITE.url}/acerca-de`, title: `Acerca de | ${SITE.fullName}`, type: "website" },
};

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const link = "font-medium text-blue-600 hover:underline dark:text-blue-400";

export default function AboutPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-3xl space-y-10 px-4 py-12">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight">Acerca de Planificador de Gastos</h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
            Una aplicación web para planificar tus gastos del año: una previsión que puedes actualizar cuando quieras y comparar entre años.
            No gestiona presupuestos ni gasto real: se centra en tener clara tu previsión.
          </p>
        </header>

        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SITE.ogImage.url} alt="Planificador de Gastos - Spending Planner: cuadrante anual, informes y comparativa entre años"
            width={SITE.ogImage.width} height={SITE.ogImage.height} loading="lazy"
            className="h-auto w-full rounded-2xl border border-slate-200 shadow-lg dark:border-slate-800" />
        </figure>

        <section aria-labelledby="caracteristicas">
          <h2 id="caracteristicas" className="text-xl font-bold">Características</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-300">
            {FEATURES.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </section>

        <section aria-labelledby="stack">
          <h2 id="stack" className="text-xl font-bold">Stack tecnológico</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {STACK.map((s) => (
              <li key={s.name} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{s.role}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="autor">
          <h2 id="autor" className="text-xl font-bold">Autor</h2>
          <p className="mt-3 text-slate-700 dark:text-slate-300">
            Creado por <strong>{SITE.author.name}</strong>. Más proyectos y artículos en su <a className={link} href={SITE.links.blog} {...ext}>blog</a>
            {" "}y en <a className={link} href={SITE.links.hub} {...ext}>Aitor Hub</a>. Para cualquier consulta, puedes usar el{" "}
            <a className={link} href={SITE.links.contact} {...ext}>formulario de contacto</a>.
          </p>
        </section>

        <p><Link href="/" className={link}>← Ir al planificador</Link></p>
      </main>
    </>
  );
}
