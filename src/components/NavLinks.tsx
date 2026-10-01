"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Cuadrante" },
  { href: "/gastos", label: "Gastos y familias" },
  { href: "/informes", label: "Informes" },
];

export default function NavLinks() {
  const path = usePathname();
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {LINKS.map((l) => {
        const on = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={on ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-sm transition-colors ${on
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}
