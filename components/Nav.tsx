import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  return (
    <nav className="flex items-center gap-4 border-b px-4 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <span className="font-semibold">Spending Planner</span>
      <Link href="/" className="hover:underline">Cuadrante</Link>
      <Link href="/gastos" className="hover:underline">Gastos y familias</Link>
      <Link href="/informes" className="hover:underline">Informes</Link>
      <div className="ml-auto flex items-center gap-3"><ThemeToggle /><UserButton /></div>
    </nav>
  );
}
