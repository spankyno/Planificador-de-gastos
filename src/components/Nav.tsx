import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import ThemeToggle from "./ThemeToggle";
import CurrencySelect from "./CurrencySelect";
import NavLinks from "./NavLinks";
import { getCurrency } from "@/app/actions";

export default async function Nav() {
  const currency = await getCurrency();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2">
        <Link href="/" className="flex items-center gap-3" aria-label="Planificador de Gastos - Spending Planner">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-600/30">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 20v-6" /><path d="M11 20V6" /><path d="M17 20v-9" /><path d="M3 20h18" />
            </svg>
          </span>
          <span className="flex flex-col leading-none">
            <span className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-base font-bold tracking-tight text-transparent dark:from-white dark:to-slate-300">
              Planificador de Gastos
            </span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">Spending Planner</span>
          </span>
        </Link>
        <NavLinks />
        <div className="ml-auto flex items-center gap-3">
          <CurrencySelect current={currency} />
          <ThemeToggle />
          <UserButton />
        </div>
      </div>
    </header>
  );
}
