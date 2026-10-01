"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  };

  return (
    <button aria-label="Cambiar entre tema claro y oscuro" onClick={toggle} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
