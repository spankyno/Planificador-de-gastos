"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, Lock, Pencil, Plus, RotateCcw, Search, X } from "lucide-react";
import { archiveItem, createCategory, createFamily, renameCategory, renameFamily, restoreItem } from "@/app/actions";

type Tipo = "FIJO" | "VARIABLE" | "DISCRECIONAL";
type Fam = { id: string; name: string; type: Tipo; userId: string | null };
type Cat = { id: string; name: string; familyId: string; userId: string | null };
type Arc = { itemType: "family" | "category"; itemId: string; fromYear: number };
type Target = { kind: "family" | "category"; id: string; name: string };

const TIPOS: Tipo[] = ["FIJO", "VARIABLE", "DISCRECIONAL"];
const TONE: Record<Tipo, { bar: string; badge: string; row: string }> = {
  FIJO: { bar: "border-l-blue-500", badge: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300", row: "bg-blue-50/60 dark:bg-blue-950/20" },
  VARIABLE: { bar: "border-l-orange-500", badge: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300", row: "bg-orange-50/60 dark:bg-orange-950/20" },
  DISCRECIONAL: { bar: "border-l-purple-500", badge: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300", row: "bg-purple-50/60 dark:bg-purple-950/20" },
};
const field = "rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900";
const ghost = "inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800";
const danger = "inline-flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-40";

export default function ManageForm({ families, categories, archives }: { families: Fam[]; categories: Cat[]; archives: Arc[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const year = new Date().getFullYear();
  const [q, setQ] = useState("");
  const [showGone, setShowGone] = useState(true);
  const [edit, setEdit] = useState<{ id: string; draft: string } | null>(null);
  const [adding, setAdding] = useState<string | null>(null); // "family" o id de familia
  const [draft, setDraft] = useState("");
  const [draftType, setDraftType] = useState<Tipo>("VARIABLE");
  const [target, setTarget] = useState<Target | null>(null);
  const [fromYear, setFromYear] = useState(year);

  const act = (fn: () => Promise<void>, after?: () => void) => start(async () => { await fn(); after?.(); router.refresh(); });
  const arc = (t: "family" | "category", id: string) => archives.find((a) => a.itemType === t && a.itemId === id);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return families.map((f) => {
      const cats = categories.filter((c) => c.familyId === f.id);
      const famMatch = f.name.toLowerCase().includes(term);
      const shown = cats.filter((c) => (!term || famMatch || c.name.toLowerCase().includes(term)) && (showGone || !arc("category", c.id)));
      return { f, cats: shown, visible: (showGone || !arc("family", f.id)) && (!term || famMatch || shown.length > 0) };
    }).filter((r) => r.visible);
  }, [families, categories, archives, q, showGone]);

  const status = (t: "family" | "category", id: string, inherited?: { fromYear: number }) => {
    const a = arc(t, id);
    if (a) return <span className="font-medium text-red-600">Baja desde {a.fromYear}</span>;
    if (inherited) return <span className="text-slate-500">Baja con su familia ({inherited.fromYear})</span>;
    return <span className="text-emerald-600">● Activo</span>;
  };

  const saveName = (kind: "family" | "category", id: string, type?: Tipo) => {
    const name = edit?.draft.trim(); if (!name) return;
    act(() => (kind === "family" ? renameFamily(id, name, type!) : renameCategory(id, name)), () => setEdit(null));
  };

  const NameCell = ({ kind, id, name, own, type, bold }: { kind: "family" | "category"; id: string; name: string; own: boolean; type?: Tipo; bold?: boolean }) =>
    edit?.id === id ? (
      <span className="flex items-center gap-1">
        <input autoFocus className={`${field} w-56`} value={edit.draft} onChange={(e) => setEdit({ id, draft: e.target.value })}
          onKeyDown={(e) => { if (e.key === "Enter") saveName(kind, id, type); if (e.key === "Escape") setEdit(null); }} />
        <button aria-label="Guardar" className={ghost} onClick={() => saveName(kind, id, type)}><Check size={14} /></button>
        <button aria-label="Cancelar" className={ghost} onClick={() => setEdit(null)}><X size={14} /></button>
      </span>
    ) : (
      <span className={`inline-flex items-center gap-2 ${bold ? "font-semibold" : ""}`}>
        {name}
        {own ? <button aria-label={`Renombrar ${name}`} className={ghost} onClick={() => setEdit({ id, draft: name })}><Pencil size={13} /></button>
             : <span title="Elemento por defecto: se puede dar de baja pero no renombrar"><Lock size={12} className="text-slate-400" /></span>}
      </span>
    );

  const AddRow = ({ famId }: { famId: string }) => adding === famId ? (
    <tr className="border-t dark:border-slate-800"><td colSpan={4} className="py-2 pl-10 pr-3">
      <span className="flex items-center gap-2">
        <input autoFocus className={`${field} w-64`} placeholder="Nombre del gasto" value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) act(() => createCategory(draft.trim(), famId), () => { setDraft(""); setAdding(null); }); if (e.key === "Escape") setAdding(null); }} />
        <button disabled={pending || !draft.trim()} className={ghost} onClick={() => act(() => createCategory(draft.trim(), famId), () => { setDraft(""); setAdding(null); })}><Check size={14} /> Añadir</button>
        <button className={ghost} onClick={() => setAdding(null)}>Cancelar</button>
      </span>
    </td></tr>
  ) : (
    <tr className="border-t dark:border-slate-800"><td colSpan={4} className="py-1 pl-10">
      <button className={`${ghost} text-blue-600`} onClick={() => { setAdding(famId); setDraft(""); }}><Plus size={13} /> Añadir gasto</button>
    </td></tr>
  );

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4 text-slate-900 dark:text-slate-100">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold">Gastos y familias</h1>
        <label className="relative">
          <Search size={14} className="absolute left-2 top-2.5 text-slate-400" />
          <input className={`${field} w-56 pl-7`} placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showGone} onChange={(e) => setShowGone(e.target.checked)} /> Mostrar bajas</label>
        <button className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          onClick={() => { setAdding("family"); setDraft(""); setDraftType("VARIABLE"); }}><Plus size={14} /> Nueva familia</button>
      </header>

      <div className="overflow-x-auto rounded-lg border dark:border-slate-800">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-900">
            <tr><th className="p-3">Nombre</th><th className="p-3">Tipo</th><th className="p-3">Estado</th><th className="p-3 text-right">Acciones</th></tr>
          </thead>
          {adding === "family" && (
            <tbody><tr className="bg-slate-50 dark:bg-slate-900"><td colSpan={4} className="p-3">
              <span className="flex flex-wrap items-center gap-2">
                <input autoFocus className={`${field} w-64`} placeholder="Nombre de la familia" value={draft} onChange={(e) => setDraft(e.target.value)} />
                <select className={field} value={draftType} onChange={(e) => setDraftType(e.target.value as Tipo)}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</select>
                <button disabled={pending || !draft.trim()} className={ghost} onClick={() => act(() => createFamily(draft.trim(), draftType), () => setAdding(null))}><Check size={14} /> Crear</button>
                <button className={ghost} onClick={() => setAdding(null)}>Cancelar</button>
              </span>
            </td></tr></tbody>
          )}
          {rows.map(({ f, cats }) => {
            const fa = arc("family", f.id);
            return (
              <tbody key={f.id}>
                <tr className={`border-l-4 ${TONE[f.type].bar} ${TONE[f.type].row} ${fa ? "opacity-70" : ""}`}>
                  <td className="p-3">{NameCell({ kind: "family", id: f.id, name: f.name, own: !!f.userId, type: f.type, bold: true })}</td>
                  <td className="p-3">
                    {f.userId ? (
                      <select aria-label="Tipo" disabled={pending} className={`${field} ${TONE[f.type].badge}`} value={f.type}
                        onChange={(e) => act(() => renameFamily(f.id, f.name, e.target.value as Tipo))}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</select>
                    ) : <span className={`rounded px-2 py-0.5 text-xs ${TONE[f.type].badge}`}>{f.type}</span>}
                  </td>
                  <td className="p-3">{status("family", f.id)}</td>
                  <td className="p-3 text-right">
                    {fa ? <button disabled={pending} className={ghost} onClick={() => act(() => restoreItem("family", f.id))}><RotateCcw size={13} /> Reactivar</button>
                        : <button disabled={pending} className={danger} onClick={() => { setTarget({ kind: "family", id: f.id, name: f.name }); setFromYear(year); }}><Ban size={13} /> Dar de baja</button>}
                  </td>
                </tr>
                {cats.map((c) => {
                  const ca = arc("category", c.id);
                  return (
                    <tr key={c.id} className={`border-t dark:border-slate-800 ${ca || fa ? "text-slate-500" : ""}`}>
                      <td className="py-2 pl-10 pr-3">{NameCell({ kind: "category", id: c.id, name: c.name, own: !!c.userId })}</td>
                      <td className="p-2" />
                      <td className="p-2">{status("category", c.id, !ca && fa ? fa : undefined)}</td>
                      <td className="p-2 text-right">
                        {ca ? <button disabled={pending} className={ghost} onClick={() => act(() => restoreItem("category", c.id))}><RotateCcw size={13} /> Reactivar</button>
                            : !fa && <button disabled={pending} className={danger} onClick={() => { setTarget({ kind: "category", id: c.id, name: c.name }); setFromYear(year); }}><Ban size={13} /> Dar de baja</button>}
                      </td>
                    </tr>
                  );
                })}
                {!fa && AddRow({ famId: f.id })}
              </tbody>
            );
          })}
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Ningún resultado. Prueba con otra búsqueda o activa «Mostrar bajas».</p>}
      </div>

      {target && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/50 p-4" onClick={() => setTarget(null)}>
          <div className="w-full max-w-sm space-y-3 rounded-lg bg-white p-5 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold">Dar de baja «{target.name}»</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Desaparecerá del cuadrante desde el año elegido{target.kind === "family" ? ", junto con todos sus gastos" : ""}. Los años anteriores y los informes conservan sus importes. Puedes reactivarlo cuando quieras.
            </p>
            <label className="block text-sm">Desde el año
              <select className={`${field} mt-1 w-full`} value={fromYear} onChange={(e) => setFromYear(+e.target.value)}>
                {[year - 1, year, year + 1, year + 2].map((y) => <option key={y}>{y}</option>)}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button className={ghost} onClick={() => setTarget(null)}>Cancelar</button>
              <button disabled={pending} className={danger} onClick={() => act(() => archiveItem(target.kind, target.id, fromYear), () => setTarget(null))}>Dar de baja</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
