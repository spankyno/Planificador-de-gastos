"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCurrency } from "@/app/actions";

const OPCIONES = ["EUR", "USD", "GBP", "CHF", "MXN", "ARS", "COP", "CLP", "PEN", "BRL"];

export default function CurrencySelect({ current }: { current: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select aria-label="Moneda" disabled={pending} value={current}
      onChange={(e) => start(async () => { await setCurrency(e.target.value); router.refresh(); })}
      className="rounded border border-slate-300 bg-white px-1 py-0.5 text-xs dark:border-slate-700 dark:bg-slate-900">
      {OPCIONES.map((c) => <option key={c}>{c}</option>)}
    </select>
  );
}
