"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, CalendarRange, ChevronDown, ChevronRight, Copy, Download, Lock, Trash2, Unlock } from "lucide-react";
import { copyYear, resetYear, saveCells, setYearLock, spreadAmount } from "@/app/actions";

type Fam = { id: string; name: string; type: "FIJO" | "VARIABLE" | "DISCRECIONAL" };
type Cat = { id: string; name: string; familyId: string; type?: string | null };
type Entry = { expenseCategoryId: string; month: number; amount: number };

// Evita la inyección de fórmulas al abrir el CSV en Excel/Calc (=, +, -, @ al inicio de una etiqueta)
const safe = (s: string) => (/^[=+\-@\t\r]/.test(s) ? `'${s}` : s);
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const ALL = MESES.map((_, i) => i + 1);
const COLOR = {
  FIJO: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  VARIABLE: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  DISCRECIONAL: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
} as const;
const money = (n: number, currency: string) => n.toLocaleString("es-ES", { style: "currency", currency, maximumFractionDigits: 0, useGrouping: "always" });

// Formato de las celdas: con separador de miles al mostrar, número "plano" al editar
const moneyCell = (n: number, currency: string) =>
  n === 0 ? "" : n.toLocaleString("es-ES", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: "always" });
const rawNum = (n: number) => (n === 0 ? "" : String(n).replace(".", ","));
// Acepta "1200", "1200,5", "1.200,50" y "1.200"
const parseAmount = (raw: string) => {
  let t = raw.replace(/[^\d.,-]/g, ""); // ignora símbolos de moneda, espacios y letras
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  return Math.max(0, parseFloat(t) || 0);
};

export default function Grid({ year, families, categories, entries, currency, locked, years }: { year: number; families: Fam[]; categories: Cat[]; entries: Entry[]; currency: string; locked: boolean; years: number[] }) {
  const router = useRouter();
  const fmt = (n: number) => money(n, currency);
  const [pending, start] = useTransition();
  const [cells, setCells] = useState<Record<string, number>>(() =>
    Object.fromEntries(entries.map((e) => [`${e.expenseCategoryId}|${e.month}`, e.amount]))
  );
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [spread, setSpread] = useState<Cat | null>(null);
  const [sAmount, setSAmount] = useState(0);
  const [sMode, setSMode] = useState<"repeat" | "split">("repeat");
  const [sMonths, setSMonths] = useState<number[]>(ALL);
  const [isLocked, setIsLocked] = useState(locked);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState<null | "reset" | "copy">(null);
  const [source, setSource] = useState<number | null>(null);

  // Tras una operación del servidor (copiar año, etc.) llegan datos nuevos: se sincroniza el estado local
  useEffect(() => { setCells(Object.fromEntries(entries.map((e) => [`${e.expenseCategoryId}|${e.month}`, e.amount]))); }, [entries]);
  useEffect(() => { setIsLocked(locked); }, [locked]);

  const get = (c: string, m: number) => cells[`${c}|${m}`] ?? 0;
  const rowTotal = (c: string) => ALL.reduce((s, m) => s + get(c, m), 0);

  const totals = useMemo(() => {
    const perMonth = ALL.map((m) => categories.reduce((s, c) => s + get(c.id, m), 0));
    return { perMonth, year: perMonth.reduce((a, b) => a + b, 0) };
  }, [cells, categories]);

  function exportCsv() {
    const num = (n: number) => n.toFixed(2).replace(".", ",");
    const head = ["Familia", "Gasto", "Tipo", ...MESES, "Total"];
    const body = families.flatMap((f) => categories.filter((c) => c.familyId === f.id).map((c) =>
      [safe(f.name), safe(c.name), c.type ?? "VARIABLE", ...ALL.map((m) => num(get(c.id, m))), num(rowTotal(c.id))]));
    body.push(["Total", "", "", ...totals.perMonth.map(num), num(totals.year)]);
    const csv = "\uFEFF" + [head, ...body].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `cuadrante-${year}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  }

  function commit(catId: string, month: number, raw: string) {
    if (isLocked) return;
    const amount = parseAmount(raw);
    if (amount === get(catId, month)) return;
    const key = `${catId}|${month}`, prev = cells[key] ?? 0;
    setCells((s) => ({ ...s, [key]: amount })); // actualización optimista
    start(async () => {
      try { await saveCells([{ categoryId: catId, year, month, amount }]); }
      catch { setCells((s) => ({ ...s, [key]: prev })); } // rollback si D1 falla
    });
  }

  function applySpread() {
    if (isLocked || !spread || !sMonths.length) return;
    const per = sMode === "split" ? Math.round((sAmount / sMonths.length) * 100) / 100 : sAmount;
    const id = spread.id;
    setCells((s) => ({ ...s, ...Object.fromEntries(sMonths.map((m) => [`${id}|${m}`, per])) }));
    start(async () => { await spreadAmount({ categoryId: id, year, months: sMonths, amount: sAmount, mode: sMode }); });
    setSpread(null);
  }

  function toggleLock() {
    const next = !isLocked;
    setIsLocked(next);
    start(async () => { try { await setYearLock(year, next); } catch { setIsLocked(!next); } });
  }

  function runConfirm() {
    const action = confirm;
    start(async () => {
      try {
        if (action === "reset") { await resetYear(year); setCells({}); }
        else if (action === "copy" && source) { await copyYear(source, year); router.refresh(); }
      } catch { router.refresh(); } // p. ej. año cerrado desde otra pestaña: se muestra el estado real
      setConfirm(null);
    });
  }

  return (
    <main className="min-h-screen bg-white p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          Cuadrante {year}
          <button aria-pressed={isLocked} aria-label={isLocked ? `Abrir el año ${year}` : `Cerrar el año ${year}`}
            title={isLocked ? "Año cerrado: pulsa para abrirlo" : "Año abierto: pulsa para cerrarlo y evitar cambios"}
            onClick={toggleLock} disabled={pending}
            className={`rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800 ${isLocked ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`}>
            {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
          </button>
          {isLocked && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">Cerrado</span>}
        </h1>
        <div className="flex gap-2">
          <div className="relative">
            <button aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}
              className="inline-flex items-center gap-1 rounded border px-3 py-1"><CalendarPlus size={14} /> Iniciar año <ChevronDown size={14} /></button>
            {menu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
                <div role="menu" className="absolute right-0 z-40 mt-1 w-72 rounded-lg border bg-white p-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  <button role="menuitem" disabled={isLocked} onClick={() => { setMenu(false); setConfirm("reset"); }}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"><Trash2 size={14} /> Poner todos los gastos a cero…</button>
                  <button role="menuitem" disabled={isLocked || years.length === 0} onClick={() => { setMenu(false); setSource(years[0] ?? null); setConfirm("copy"); }}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"><Copy size={14} /> Copiar valores de otro año…</button>
                  {isLocked && <p className="px-3 py-2 text-xs text-amber-700 dark:text-amber-400">El año está cerrado. Ábrelo con el candado para modificarlo.</p>}
                  {!isLocked && years.length === 0 && <p className="px-3 py-2 text-xs text-slate-500">No hay otros años con importes para copiar.</p>}
                </div>
              </>
            )}
          </div>
          <button className="inline-flex items-center gap-1 rounded border px-3 py-1" onClick={exportCsv}><Download size={14} /> CSV</button>
          <button className="rounded border px-3 py-1" onClick={() => router.push(`/?y=${year - 1}`)}>{year - 1}</button>
          <button className="rounded border px-3 py-1" onClick={() => router.push(`/?y=${year + 1}`)}>{year + 1}</button>
        </div>
      </header>

      <div className="max-h-[calc(100vh-11rem)] overflow-auto scroll-smooth rounded-lg border dark:border-slate-800 xl:max-h-none xl:overflow-visible">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 bg-slate-50 p-2 text-left dark:bg-slate-900 xl:top-[3.4rem]">Gasto</th>
              {MESES.map((m) => <th key={m} className="sticky top-0 z-10 bg-slate-50 p-2 text-right dark:bg-slate-900 xl:top-[3.4rem]">{m}</th>)}
              <th className="sticky top-0 z-10 bg-slate-50 p-2 text-right dark:bg-slate-900 xl:top-[3.4rem]">Total anual</th>
            </tr>
          </thead>
          <tbody>
            {families.map((f) => (
              <FamilyRows key={f.id} f={f} cats={categories.filter((c) => c.familyId === f.id)}
                isOpen={open[f.id] ?? true} toggle={() => setOpen((o) => ({ ...o, [f.id]: !(o[f.id] ?? true) }))}
                get={get} rowTotal={rowTotal} commit={commit} locked={isLocked} fmt={fmt} fmtCell={(n: number) => moneyCell(n, currency)} onSpread={(c: Cat) => { setSpread(c); setSAmount(0); setSMonths(ALL); }} />
            ))}
          </tbody>
          <tfoot className="border-t-2 font-semibold dark:border-slate-700">
            <tr>
              <td className="sticky bottom-0 left-0 z-10 bg-white p-2 dark:bg-slate-950">Total mensual</td>
              {totals.perMonth.map((t, i) => <td key={i} className="sticky bottom-0 bg-white p-2 text-right tabular-nums dark:bg-slate-950">{fmt(t)}</td>)}
              <td className="sticky bottom-0 bg-white p-2 text-right tabular-nums dark:bg-slate-950">{fmt(totals.year)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setConfirm(null)}>
          <div role="alertdialog" aria-modal="true" className="w-full max-w-sm space-y-3 rounded-lg bg-white p-5 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold">{confirm === "reset" ? `Poner a cero el año ${year}` : `Copiar valores al año ${year}`}</h2>
            {confirm === "reset" ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">Se eliminarán todos los importes de {year}. Esta acción no se puede deshacer.</p>
            ) : (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-400">Los importes de {year} se sustituirán por los del año que elijas. Esta acción no se puede deshacer.</p>
                <label className="block text-sm">Copiar desde
                  <select className="mt-1 w-full rounded border p-2 dark:border-slate-700 dark:bg-slate-800" value={source ?? ""} onChange={(e) => setSource(Number(e.target.value))}>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </label>
              </>
            )}
            <div className="flex justify-end gap-2">
              <button className="rounded border px-3 py-1.5 text-sm" onClick={() => setConfirm(null)}>Cancelar</button>
              <button disabled={pending || (confirm === "copy" && !source)} onClick={runConfirm}
                className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {confirm === "reset" ? "Poner a cero" : "Copiar y sustituir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {spread && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/50" onClick={() => setSpread(null)}>
          <div className="w-96 space-y-3 rounded-lg bg-white p-4 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold">Periodificar: {spread.name}</h2>
            <input type="number" min={0} value={sAmount} onChange={(e) => setSAmount(+e.target.value)}
              className="w-full rounded border p-2 dark:bg-slate-800" placeholder="Importe" />
            <select value={sMode} onChange={(e) => setSMode(e.target.value as "repeat" | "split")}
              className="w-full rounded border p-2 dark:bg-slate-800">
              <option value="repeat">Repetir el importe en cada mes</option>
              <option value="split">Repartir el importe entre los meses</option>
            </select>
            <div className="grid grid-cols-6 gap-1">
              {MESES.map((m, i) => (
                <button key={m} onClick={() => setSMonths((s) => s.includes(i + 1) ? s.filter((x) => x !== i + 1) : [...s, i + 1])}
                  className={`rounded border p-1 text-xs ${sMonths.includes(i + 1) ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : ""}`}>{m}</button>
              ))}
            </div>
            <button onClick={applySpread} className="w-full rounded bg-blue-600 p-2 text-white">Aplicar a {sMonths.length} meses</button>
          </div>
        </div>
      )}
    </main>
  );
}

function FamilyRows({ f, cats, isOpen, toggle, get, rowTotal, commit, onSpread, fmt, fmtCell, locked }: any) {
  const fam = ALL.map((m) => cats.reduce((s: number, c: Cat) => s + get(c.id, m), 0));
  return (
    <>
      <tr className="bg-slate-100/70 dark:bg-slate-900/70">
        <td className="sticky left-0 bg-slate-100 p-2 font-medium dark:bg-slate-900">
          <button className="flex items-center gap-1" onClick={toggle}>
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />} {f.name}
          </button>
        </td>
        {fam.map((t: number, i: number) => <td key={i} className="p-2 text-right tabular-nums">{fmt(t)}</td>)}
        <td className="p-2 text-right font-medium tabular-nums">{fmt(fam.reduce((a: number, b: number) => a + b, 0))}</td>
      </tr>
      {isOpen && cats.map((c: Cat) => (
        <tr key={c.id} className="border-t dark:border-slate-800">
          <td className="sticky left-0 bg-white p-2 pl-8 dark:bg-slate-950">
            <span className="mr-2">{c.name}</span>
            <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] ${COLOR[(c.type ?? "VARIABLE") as keyof typeof COLOR]}`}>{c.type ?? "VARIABLE"}</span>
            <button aria-label={`Periodificar ${c.name}`} disabled={locked} className="disabled:opacity-30" onClick={() => onSpread(c)}><CalendarRange size={14} /></button>
          </td>
          {ALL.map((m) => (
            <td key={m} className="p-0">
              <input inputMode="decimal" defaultValue={fmtCell(get(c.id, m))} key={get(c.id, m)}
                readOnly={locked}
                onFocus={(e) => { if (locked) return; e.target.value = rawNum(get(c.id, m)); e.target.select(); }}
                onBlur={(e) => { if (locked) return; const v = parseAmount(e.target.value); commit(c.id, m, e.target.value); e.target.value = fmtCell(v); }}
                className={`w-full bg-transparent p-2 text-right tabular-nums focus:outline-none ${locked ? "cursor-not-allowed text-slate-500" : "focus:bg-yellow-50 dark:focus:bg-slate-800"}`} />
            </td>
          ))}
          <td className="p-2 text-right tabular-nums">{fmt(rowTotal(c.id))}</td>
        </tr>
      ))}
    </>
  );
}
