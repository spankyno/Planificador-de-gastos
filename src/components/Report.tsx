"use client";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Fam = { id: string; name: string; type: "FIJO" | "VARIABLE" | "DISCRECIONAL" };
type Cat = { id: string; familyId: string };
type Entry = { expenseCategoryId: string; year: number; month: number; amount: number };
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const TIPOS = ["FIJO", "VARIABLE", "DISCRECIONAL"] as const;
const TIPO_COLOR = { FIJO: "#2563eb", VARIABLE: "#f97316", DISCRECIONAL: "#9333ea" };
const YEAR_COLORS = ["#64748b", "#0ea5e9", "#10b981", "#eab308"];
const eur = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export default function Report({ years, families, categories, entries }: { years: number[]; families: Fam[]; categories: Cat[]; entries: Entry[] }) {
  const router = useRouter();
  const typeOf = new Map<string, Fam["type"]>();
  const famType = new Map(families.map((f) => [f.id, f.type]));
  categories.forEach((c) => { const t = famType.get(c.familyId); if (t) typeOf.set(c.id, t); });

  // totales[año][tipo] y mensual[mes][año]
  const byType: Record<number, Record<string, number>> = {};
  const monthly = MESES.map((m) => ({ mes: m } as Record<string, number | string>));
  years.forEach((y) => { byType[y] = { FIJO: 0, VARIABLE: 0, DISCRECIONAL: 0 }; monthly.forEach((r) => (r[y] = 0)); });
  entries.forEach((e) => {
    const t = typeOf.get(e.expenseCategoryId); if (!t || !byType[e.year]) return;
    byType[e.year][t] += e.amount;
    (monthly[e.month - 1][e.year] as number) += e.amount;
  });
  const total = (y: number) => TIPOS.reduce((s, t) => s + byType[y][t], 0);
  const last = years[years.length - 1];
  const pie = TIPOS.map((t) => ({ name: t, value: byType[last][t] })).filter((d) => d.value > 0);

  const setYears = (ys: number[]) => router.push(`/informes?y=${[...new Set(ys)].sort().join(",")}`);
  const thisYear = new Date().getFullYear();
  const options = Array.from({ length: 6 }, (_, i) => thisYear - 4 + i);

  const pct = (a: number, b: number) => (a === 0 ? "—" : `${(((b - a) / a) * 100).toFixed(1)} %`);

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-4 text-slate-900 dark:text-slate-100">
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="mr-4 text-xl font-semibold">Informes</h1>
        {options.map((y) => (
          <button key={y} aria-pressed={years.includes(y)}
            onClick={() => setYears(years.includes(y) ? years.filter((x) => x !== y) : [...years, y].slice(-4))}
            className={`rounded border px-3 py-1 text-sm dark:border-slate-700 ${years.includes(y) ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : ""}`}>{y}</button>
        ))}
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-2 font-medium">Reparto {last}: fijo, variable, discrecional</h2>
          {pie.length === 0 ? <p className="text-sm text-slate-500">No hay importes en {last}.</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                  {pie.map((d) => <Cell key={d.name} fill={TIPO_COLOR[d.name as keyof typeof TIPO_COLOR]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => eur(v)} /><Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>
        <section>
          <h2 className="mb-2 font-medium">Gasto mensual por año</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="mes" /><YAxis tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => eur(v)} /><Legend />
              {years.map((y, i) => <Bar key={y} dataKey={String(y)} fill={YEAR_COLORS[i % 4]} />)}
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section className="overflow-x-auto">
        <h2 className="mb-2 font-medium">Comparativa interanual</h2>
        <table className="w-full min-w-[520px] text-sm">
          <thead><tr className="border-b text-right dark:border-slate-800">
            <th className="p-2 text-left">Tipo</th>
            {years.map((y) => <th key={y} className="p-2">{y}</th>)}
            {years.length > 1 && <><th className="p-2">Variación</th><th className="p-2">%</th></>}
          </tr></thead>
          <tbody>
            {[...TIPOS, "TOTAL" as const].map((t) => {
              const val = (y: number) => (t === "TOTAL" ? total(y) : byType[y][t]);
              const a = val(years[0]), b = val(last);
              return (
                <tr key={t} className={`border-b text-right tabular-nums dark:border-slate-800 ${t === "TOTAL" ? "font-semibold" : ""}`}>
                  <td className="p-2 text-left">{t}</td>
                  {years.map((y) => <td key={y} className="p-2">{eur(val(y))}</td>)}
                  {years.length > 1 && <>
                    <td className={`p-2 ${b > a ? "text-red-600" : "text-green-600"}`}>{eur(b - a)}</td>
                    <td className="p-2">{pct(a, b)}</td>
                  </>}
                </tr>
              );
            })}
          </tbody>
        </table>
        {years.length > 1 && <p className="mt-2 text-xs text-slate-500">Variación de {years[0]} a {last}. En rojo, el gasto sube; en verde, baja (ahorro).</p>}
      </section>
    </main>
  );
}
