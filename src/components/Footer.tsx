import Link from "next/link";
import { SITE } from "@/lib/site";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const a = "text-slate-600 hover:text-blue-600 hover:underline dark:text-slate-400 dark:hover:text-blue-400";

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-slate-200 bg-slate-50 text-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-8 sm:grid-cols-3">
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{SITE.name}</p>
          <p className="mt-2 max-w-xs text-slate-600 dark:text-slate-400">Previsión anual de gastos por familias y meses, con informes y comparativa entre años.</p>
        </div>
        <nav aria-label="El proyecto" className="flex flex-col gap-2">
          <p className="font-medium text-slate-900 dark:text-slate-100">El proyecto</p>
          <a className={a} href={SITE.url}>planificador-de-gastos.pages.dev</a>
          <Link className={a} href="/acerca-de">Acerca de</Link>
        </nav>
        <nav aria-label="Autor" className="flex flex-col gap-2">
          <p className="font-medium text-slate-900 dark:text-slate-100">{SITE.author.name}</p>
          <a className={a} href={SITE.links.blog} {...ext}>Blog</a>
          <a className={a} href={SITE.links.hub} {...ext}>Aitor Hub</a>
          <a className={a} href={SITE.links.contact} {...ext}>Contacto</a>
        </nav>
      </div>
      <p className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-500 dark:border-slate-800">
        © {new Date().getFullYear()} {SITE.author.name}. Todos los derechos reservados.
      </p>
    </footer>
  );
}
