"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Download, Table2 } from "lucide-react";

type Tipo = "FIJO" | "VARIABLE" | "DISCRECIONAL";
type Fam = { id: string; name: string; type: Tipo };
type Cat = { id: string; name: string; familyId: string; type: Tipo | null };
type Entry = { expenseCategoryId: string; year: number; month: number; amount: number };
type Row = { key: string; label: string; sub?: string; color: string; famId?: string; vals: Record<number, number> };
type Dim = "tipo" | "familia" | "gasto" | "mensual";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const TIPOS: Tipo[] = ["FIJO", "VARIABLE", "DISCRECIONAL"];
const TIPO_COLOR: Record<Tipo, string> = { FIJO: "#2563eb", VARIABLE: "#f97316", DISCRECIONAL: "#9333ea" };
const YEAR_COLORS = ["#64748b", "#0ea5e9", "#10b981", "#eab308"];
const PALETTE = ["#2563eb","#f97316","#9333ea","#10b981","#eab308","#ef4444","#0ea5e9","#ec4899","#14b8a6","#84cc16"];
const DIMS: { id: Dim; label: string }[] = [
  { id: "tipo", label: "Por tipo" }, { id: "familia", label: "Por familia" },
  { id: "gasto", label: "Por gasto" }, { id: "mensual", label: "Mensual" },
];
const eur = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const seg = (on: boolean) => `inline-flex items-center gap-1 px-3 py-1 text-sm ${on ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`;

export default function Report({ years, families, categories, entries }: { years: number[]; families: Fam[]; categories: Cat[]; entries: Entry[] }) {
  const router = useRouter();
  const [dim, setDim] = useState<Dim>("tipo");
  const [view, setView] = useState<"tabla" | "grafico">("tabla");
  const [famSel, setFamSel] = useState<string | null>(null); // familia abierta en el desglose
  const last = years[years.length - 1];

  const rows: Row[] = useMemo(() => {
    const zero = () => Object.fromEntries(years.map((y) => [y, 0])) as Record<number, number>;
    const famOf = new Map(families.map((f) => [f.id, f]));
    const catOf = new Map(categories.map((c) => [c.id, c]));
    const tipo = new Map<string, Row>(TIPOS.map((t) => [t, { key: t, label: t, color: TIPO_COLOR[t], vals: zero() }]));
    const fam = new Map<string, Row>(families.map((f, i) => [f.id, { key: f.id, label: f.name, color: PALETTE[i % PALETTE.length], vals: zero() }]));
    const cat = new Map<string, Row>(categories.map((c, i) => [c.id, { key: c.id, label: c.name, sub: famOf.get(c.familyId)?.name, famId: c.familyId, color: TIPO_COLOR[c.type ?? "VARIABLE"], vals: zero() }]));
    const mes: Row[] = MESES.map((m, i) => ({ key: String(i), label: m, color: "#64748b", vals: zero() }));
    entries.forEach((e) => {
      const c = catOf.get(e.expenseCategoryId); const f = c && famOf.get(c.familyId);
      if (!c || !f || !(e.year in mes[0].vals)) return;
      tipo.get(c.type ?? "VARIABLE")!.vals[e.year] += e.amount;
      fam.get(f.id)!.vals[e.year] += e.amount;
      cat.get(c.id)!.vals[e.year] += e.amount;
      mes[e.month - 1].vals[e.year] += e.amount;
    });
    const sum = (r: Row) => years.reduce((s, y) => s + r.vals[y], 0);
    const byLast = (a: Row, b: Row) => b.vals[last] - a.vals[last] || sum(b) - sum(a);
    if (dim === "tipo") return [...tipo.values()];
    if (dim === "mensual") return mes;
    if (dim === "familia" && famSel) return [...cat.values()].filter((r) => r.famId === famSel && sum(r) > 0).sort(byLast);
    const list = [...(dim === "familia" ? fam : cat).values()].filter((r) => sum(r) > 0);
    return list.sort(byLast);
  }, [dim, famSel, years, families, categories, entries, last]);

  const tot = (y: number) => rows.reduce((s, r) => s + r.vals[y], 0);
  const pct = (a: number, b: number) => (a === 0 ? "—" : `${(((b - a) / a) * 100).toFixed(1)} %`);
  const data = rows.map((r) => ({ rid: r.key, name: r.label, ...Object.fromEntries(years.map((y) => [String(y), r.vals[y]])) }));
  const pie = rows.map((r) => ({ rid: r.key, name: r.label, value: r.vals[last], color: r.color })).filter((d) => d.value > 0);
  const horizontal = dim === "familia" || dim === "gasto";
  const multi = years.length > 1;
  const canDrill = dim === "familia" && !famSel;
  const drill = (rid?: string) => { if (canDrill && rid) setFamSel(rid); };
  // Etiqueta del eje vertical clicable (abre el desglose de la familia)
  const yTick = (p: any) => {
    const row = rows.find((r) => r.label === p.payload.value);
    return (
      <text x={p.x} y={p.y} dy={4} textAnchor="end" fontSize={12} fill="currentColor"
        style={{ cursor: canDrill ? "pointer" : undefined }} onClick={() => drill(row?.key)}>
        {p.payload.value}
      </text>
    );
  };
  const dimLabel = dim === "familia" && famSel ? "Gasto" : DIMS.find((d) => d.id === dim)!.label.replace("Por ", "").replace(/^./, (c) => c.toUpperCase());

  const exportCsv = () => {
    const num = (n: number) => n.toFixed(2).replace(".", ",");
    const head = [dimLabel, ...years, ...(multi ? ["Variación", "%"] : [])];
    const line = (label: string, v: (y: number) => number) => [label, ...years.map((y) => num(v(y))),
      ...(multi ? [num(v(last) - v(years[0])), pct(v(years[0]), v(last))] : [])];
    const body = [...rows.map((r) => line(r.sub ? `${r.label} (${r.sub})` : r.label, (y) => r.vals[y])), line("Total", tot)];
    const csv = "\uFEFF" + [head, ...body].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `informe-${dim}${famSel ? "-desglose" : ""}-${years.join("-")}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  const thisYear = new Date().getFullYear();
  const options = Array.from({ length: 6 }, (_, i) => thisYear - 4 + i);
  const setYears = (ys: number[]) => router.push(`/informes?y=${[...new Set(ys)].sort().join(",")}`);

  return (
    <main className="mx-auto max-w-6xl space-y-5 p-4 text-slate-900 dark:text-slate-100">
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="mr-4 text-xl font-semibold">Informes</h1>
        {options.map((y) => (
          <button key={y} aria-pressed={years.includes(y)}
            onClick={() => setYears(years.includes(y) ? years.filter((x) => x !== y) : [...years, y].slice(-4))}
            className={`rounded border px-3 py-1 text-sm dark:border-slate-700 ${years.includes(y) ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : ""}`}>{y}</button>
        ))}
        <button onClick={exportCsv} className="ml-auto inline-flex items-center gap-1 rounded border px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"><Download size={14} /> CSV</button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="inline-flex overflow-hidden rounded border dark:border-slate-700">
          {DIMS.map((d) => <button key={d.id} role="tab" aria-selected={dim === d.id} className={seg(dim === d.id)} onClick={() => { setDim(d.id); setFamSel(null); }}>{d.label}</button>)}
        </div>
        <div className="inline-flex overflow-hidden rounded border dark:border-slate-700">
          <button className={seg(view === "tabla")} onClick={() => setView("tabla")}><Table2 size={14} /> Tabla</button>
          <button className={seg(view === "grafico")} onClick={() => setView("grafico")}><BarChart3 size={14} /> Gráfico</button>
        </div>
      </div>

      {dim === "familia" && (famSel ? (
        <div className="flex items-center gap-2 text-sm">
          <button className="text-blue-600 hover:underline" onClick={() => setFamSel(null)}>← Todas las familias</button>
          <span className="text-slate-400">/</span>
          <span className="font-medium">Desglose de {families.find((f) => f.id === famSel)?.name}</span>
        </div>
      ) : <p className="text-xs text-slate-500">Haz clic en una familia (en la tabla o en el gráfico) para ver el desglose de sus gastos.</p>)}

      {rows.every((r) => years.every((y) => r.vals[y] === 0)) ? (
        <p className="rounded border p-8 text-center text-sm text-slate-500 dark:border-slate-800">No hay importes en los años seleccionados.</p>
      ) : view === "tabla" ? (
        <div className="overflow-x-auto rounded-lg border dark:border-slate-800">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-900">
              <tr className="text-right">
                <th className="p-3 text-left">{dimLabel}</th>
                {years.map((y) => <th key={y} className="p-3">{y}</th>)}
                {multi && <><th className="p-3">Variación</th><th className="p-3">%</th></>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t text-right tabular-nums dark:border-slate-800">
                  <td className="p-3 text-left">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: r.color }} />
                    {canDrill ? <button className="text-blue-600 hover:underline" onClick={() => drill(r.key)}>{r.label}</button> : r.label}{r.sub && <span className="ml-2 text-xs text-slate-500">{r.sub}</span>}
                  </td>
                  {years.map((y) => <td key={y} className="p-3">{eur(r.vals[y])}</td>)}
                  {multi && (() => { const d = r.vals[last] - r.vals[years[0]]; return <>
                    <td className={`p-3 ${d > 0 ? "text-red-600" : d < 0 ? "text-green-600" : ""}`}>{eur(d)}</td>
                    <td className="p-3">{pct(r.vals[years[0]], r.vals[last])}</td></>; })()}
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 font-semibold dark:border-slate-700">
              <tr className="text-right tabular-nums">
                <td className="p-3 text-left">Total</td>
                {years.map((y) => <td key={y} className="p-3">{eur(tot(y))}</td>)}
                {multi && <><td className="p-3">{eur(tot(last) - tot(years[0]))}</td><td className="p-3">{pct(tot(years[0]), tot(last))}</td></>}
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className={`grid grid-cols-[minmax(0,1fr)] gap-6 ${(dim === "tipo" || dim === "familia") ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]" : ""}`}>
          {(dim === "tipo" || dim === "familia") && (
            <section>
              <h2 className="mb-2 text-sm font-medium">Reparto {last}</h2>
              {pie.length === 0 ? <p className="text-sm text-slate-500">Sin importes en {last}.</p> : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={105} onClick={(d: any) => drill(d?.rid ?? d?.payload?.rid)}>{pie.map((d) => <Cell key={d.name} fill={d.color} />)}</Pie>
                    <Tooltip formatter={(v: number) => eur(v)} /><Legend onClick={(e: any) => drill(rows.find((r) => r.label === e?.value)?.key)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </section>
          )}
          <section className="min-w-0">
            <h2 className="mb-2 text-sm font-medium">{multi ? "Comparativa por año" : `Importe ${last}`}</h2>
            <ResponsiveContainer width="100%" height={horizontal ? Math.max(300, rows.length * 26 * years.length + 60) : 300}>
              <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: horizontal ? 8 : 0 }}
                onClick={(st: any) => drill(st?.activePayload?.[0]?.payload?.rid)} style={{ cursor: canDrill ? "pointer" : undefined }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                {horizontal && <XAxis type="number" tickFormatter={(v) => `${v / 1000}k`} />}
                {horizontal && <YAxis type="category" dataKey="name" width={170} interval={0} tick={yTick} />}
                {!horizontal && <XAxis dataKey="name" />}
                {!horizontal && <YAxis tickFormatter={(v) => `${v / 1000}k`} />}
                <Tooltip formatter={(v: number) => eur(v)} />{multi && <Legend />}
                {years.map((y, i) => <Bar key={y} dataKey={String(y)} fill={YEAR_COLORS[i % 4]} onClick={(d: any) => drill(d?.payload?.rid ?? d?.rid)} />)}
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>
      )}
      {multi && view === "tabla" && <p className="text-xs text-slate-500">Variación de {years[0]} a {last}. En rojo el gasto sube; en verde baja (ahorro).</p>}
    </main>
  );
}
