import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { BarChart3, CalendarRange, Download, Layers, LayoutGrid, TrendingUp } from "lucide-react";
import PublicHeader from "./PublicHeader";

const CARDS = [
  { icon: LayoutGrid, title: "Cuadrante anual", text: "Todos tus gastos por familias y meses en una sola tabla, con subtotales y totales calculados al instante." },
  { icon: CalendarRange, title: "Previsión editable", text: "Ajusta cualquier importe cuando cambien tus planes. Repite o prorratea una cantidad en los meses que elijas." },
  { icon: Layers, title: "Fijo, variable o discrecional", text: "Clasifica cada gasto y observa cuánto de tu año está comprometido y cuánto es flexible." },
  { icon: BarChart3, title: "Informes en tabla y gráfico", text: "Por tipo, familia, gasto y mes, con desglose de los gastos de cada familia." },
  { icon: TrendingUp, title: "Comparativa entre años", text: "Compara hasta cuatro años y mide la variación en importe y en porcentaje." },
  { icon: Download, title: "Tus datos, a tu manera", text: "Exporta a CSV, elige tu moneda y cambia entre tema claro y oscuro." },
];

export default function Landing() {
  return (
    <>
      <PublicHeader />
      <main>
        <section className="bg-gradient-to-b from-blue-50 to-white px-4 py-16 text-center dark:from-slate-900 dark:to-slate-950 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">Spending Planner</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Planificador de gastos anuales</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
              Organiza tus gastos por familias y meses, mantén tu previsión siempre al día y compara cómo evoluciona tu año frente a los anteriores.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <SignInButton><button className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/30 hover:opacity-90">Empezar gratis</button></SignInButton>
              <Link href="/acerca-de" className="rounded-full border border-slate-300 px-6 py-3 font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Cómo funciona</Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="funciones">
          <h2 id="funciones" className="text-center text-2xl font-bold">Todo lo que necesitas para planificar tus gastos</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Icon size={20} /></span>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{text}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
