import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import Brand from "./Brand";

export default function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Brand />
        <nav className="ml-auto flex items-center gap-2 text-sm">
          <Link href="/acerca-de" className="rounded-full px-3 py-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Acerca de</Link>
          <SignInButton><button className="rounded-full bg-slate-900 px-4 py-1.5 font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">Iniciar sesión</button></SignInButton>
        </nav>
      </div>
    </header>
  );
}
