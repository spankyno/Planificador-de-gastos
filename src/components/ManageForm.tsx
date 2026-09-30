"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFamily, createCategory } from "@/app/actions";

type Fam = { id: string; name: string; type: "FIJO" | "VARIABLE" | "DISCRECIONAL"; userId: string | null };
type Cat = { id: string; name: string; familyId: string; userId: string | null };
const TIPOS = ["FIJO", "VARIABLE", "DISCRECIONAL"] as const;
const input = "w-full rounded border p-2 dark:border-slate-700 dark:bg-slate-900";

export default function ManageForm({ families, categories }: { families: Fam[]; categories: Cat[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState<Fam["type"]>("VARIABLE");
  const [cName, setCName] = useState("");
  const [cFam, setCFam] = useState(families[0]?.id ?? "");

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
              <p className="font-medium">{f.name} <span className="text-xs text-slate-500">{f.type}{f.userId ? "" : " · por defecto"}</span></p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {categories.filter((c) => c.familyId === f.id).map((c) => c.name).join(", ") || "Sin gastos todavía"}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
