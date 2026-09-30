"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFamily, createCategory, renameFamily, renameCategory, archiveCategory, restoreCategory } from "@/app/actions";

type Fam = { id: string; name: string; type: "FIJO" | "VARIABLE" | "DISCRECIONAL"; userId: string | null };
type Cat = { id: string; name: string; familyId: string; userId: string | null; archivedFromYear: number | null };
const TIPOS = ["FIJO", "VARIABLE", "DISCRECIONAL"] as const;
const input = "w-full rounded border p-2 dark:border-slate-700 dark:bg-slate-900";

export default function ManageForm({ families, categories }: { families: Fam[]; categories: Cat[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState<Fam["type"]>("VARIABLE");
  const [cName, setCName] = useState("");
  const [cFam, setCFam] = useState(families[0]?.id ?? "");

  const year = new Date().getFullYear();
  const act = (fn: () => Promise<void>) => start(async () => { await fn(); router.refresh(); });
  const link = "text-xs text-blue-600 hover:underline disabled:opacity-50";

  const run = (fn: () => Promise<void>, reset: () => void) =>
    start(async () => { await fn(); reset(); router.refresh(); });

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-4 text-slate-900 dark:text-slate-100">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Nueva familia</h2>
        <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
          <input className={input} placeholder="Nombre (p. ej. Mascotas)" value={fName} onChange={(e) => setFName(e.target.value)} />
          <select className={input} value={fType} onChange={(e) => setFType(e.target.value as Fam["type"])}>
            {TIPOS.map((t) => <option key={t}>{t}</option>)}
          </select>
          <button disabled={pending || !fName.trim()} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            onClick={() => run(() => createFamily(fName.trim(), fType), () => setFName(""))}>Añadir familia</button>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Nuevo gasto</h2>
        <div className="grid gap-2 sm:grid-cols-[1fr_220px_auto]">
          <input className={input} placeholder="Nombre (p. ej. Veterinario)" value={cName} onChange={(e) => setCName(e.target.value)} />
          <select className={input} value={cFam} onChange={(e) => setCFam(e.target.value)}>
            {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button disabled={pending || !cName.trim() || !cFam} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            onClick={() => run(() => createCategory(cName.trim(), cFam), () => setCName(""))}>Añadir gasto</button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Tu estructura</h2>
        <ul className="space-y-3">
          {families.map((f) => (
            <li key={f.id} className="rounded border p-3 dark:border-slate-800">
              <p className="font-medium">
                {f.name} <span className="text-xs text-slate-500">{f.type}{f.userId ? "" : " · por defecto"}</span>
                {f.userId && (
                  <button disabled={pending} className={`ml-3 ${link}`} onClick={() => {
                    const n = window.prompt("Nuevo nombre de la familia", f.name)?.trim();
                    if (n) act(() => renameFamily(f.id, n, f.type));
                  }}>Renombrar</button>
                )}
              </p>
              <ul className="mt-1 space-y-1 text-sm">
                {categories.filter((c) => c.familyId === f.id).map((c) => (
                  <li key={c.id} className={c.archivedFromYear ? "text-slate-500" : ""}>
                    {c.name}
                    {c.archivedFromYear && <span className="ml-2 text-xs">(baja desde {c.archivedFromYear})</span>}
                    {c.userId && (
                      <span className="ml-3 space-x-3">
                        <button disabled={pending} className={link} onClick={() => {
                          const n = window.prompt("Nuevo nombre del gasto", c.name)?.trim();
                          if (n) act(() => renameCategory(c.id, n));
                        }}>Renombrar</button>
                        {c.archivedFromYear
                          ? <button disabled={pending} className={link} onClick={() => act(() => restoreCategory(c.id))}>Reactivar</button>
                          : <button disabled={pending} className={link} onClick={() => {
                              const y = Number(window.prompt(`Dar de baja desde el año (se conserva el historial anterior)`, String(year)));
                              if (y > 1990 && y < 2100) act(() => archiveCategory(c.id, y));
                            }}>Dar de baja</button>}
                      </span>
                    )}
                  </li>
                ))}
                {categories.filter((c) => c.familyId === f.id).length === 0 && <li className="text-slate-500">Sin gastos todavía</li>}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
