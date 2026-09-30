import Link from "next/link";

export const runtime = "edge";

export default function NotFound() {
  return (
    <main className="grid min-h-[60vh] place-items-center p-4 text-center text-slate-900 dark:text-slate-100">
      <div>
        <h1 className="text-xl font-semibold">Página no encontrada</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">La dirección no existe o se ha movido.</p>
        <Link href="/" className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-white">Volver al cuadrante</Link>
      </div>
    </main>
  );
}
