# Spending Planner

Planificador de gastos anuales: una **previsión** editable, organizada por familias y gastos, que se puede actualizar en cualquier momento y comparar entre años.

**Stack:** Next.js 15 (App Router, edge runtime) · Cloudflare Pages · Cloudflare D1 + Drizzle ORM · Clerk · Tailwind CSS · Recharts.

## Funciones

- **Cuadrante anual:** grilla de gastos por meses, agrupados en familias colapsables, con subtotales, totales mensuales y total anual. Edición de celdas con actualización optimista.
- **Periodificación:** repetir o prorratear un importe en los meses elegidos.
- **Iniciar año:** poner todos los importes de un año a cero, o copiar los valores de otro año con un ajuste porcentual opcional (por ejemplo +3 %), a todos los gastos o solo a un tipo (ambas con confirmación).
- **Candado por año:** un año cerrado no admite cambios en los importes (se comprueba en el servidor); abrirlo pide confirmación.
- **Teclado en el cuadrante:** flechas e Intro para moverte entre celdas, Esc para cancelar un cambio.
- **Gastos y familias** (`/gastos`): vista de tabla con alta, renombrado y baja desde un año (se conserva el historial anterior). El tipo (Fijo, Variable, Discrecional) se asigna a cada gasto.
- **Informes** (`/informes`): vistas por tipo, familia, gasto y mes, cada una en tabla y en gráfico; desglose de gastos al elegir una familia; comparativa entre hasta 4 años con variación en importe y en %.
- **Exportación a CSV** del cuadrante y de los informes, e **impresión / PDF** de los informes (tabla y gráfico en una vista limpia).
- **Moneda por usuario** y **tema claro/oscuro**.

## Estructura

```
├── db/seed.sql              # Familias y gastos globales por defecto
├── docs/DATABASE.md         # Cómo crear y actualizar las tablas en D1
├── migrations/              # 0000 a 0004: esquema y cambios (se aplican con wrangler)
├── src/
│   ├── app/                 # Páginas, layout, server actions
│   ├── components/          # Grid, ManageForm, Report, Nav, ThemeToggle, CurrencySelect
│   ├── db/                  # Esquema Drizzle y conexión a D1
│   └── middleware.ts        # Protección de rutas (Clerk)
├── wrangler.toml            # Binding D1 y config de Pages
└── package.json
```

> Todo el código vive dentro de `src/`. **No debe existir** una carpeta `app/` en la raíz: Next.js la preferiría y dejaría de leer `src/` (incluido el middleware de Clerk).

## Puesta en marcha local

```bash
npm install
cp .env.example .env.local          # claves de Clerk
cp .dev.vars.example .dev.vars
# Crea la base de datos y las tablas: ver docs/DATABASE.md
npm run dev
```

## Despliegue en Cloudflare Pages (desde GitHub)

1. **Workers & Pages → Create → Pages → Connect to Git** y elige el repo.
2. Configuración de build:
   - **Framework preset:** None
   - **Build command:** `npx @cloudflare/next-on-pages`
   - **Build output directory:** `.vercel/output/static`
   - **Variable de entorno:** `NODE_VERSION` = `20`
3. **Settings → Variables and Secrets:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (disponible en el build) y `CLERK_SECRET_KEY` (secreto).
4. **Settings → Bindings:** binding D1 `DB` → `spending-planner-db`.
5. **Settings → Runtime:** compatibility flag `nodejs_compat` (producción y preview).
6. Aplica las migraciones y la semilla en la base remota (ver `docs/DATABASE.md`) **antes** de desplegar una versión que las necesite.
7. En Clerk, añade el dominio `*.pages.dev` (o el tuyo) como permitido.

## Notas técnicas

- Todas las rutas deben declarar `export const runtime = "edge"` (requisito de `next-on-pages`); `layout.tsx` y `not-found.tsx` también.
- Los importes se guardan por usuario, gasto, año y mes; el índice único `uniq_cell` permite el upsert por celda.
- Los elementos con `user_id` nulo son globales (los ve todo el mundo); los propios solo los ve su autor. Las bajas son por usuario (`item_archive`), también para los elementos por defecto.
- El tipo de gasto vive en `expense_category.type`. La columna `family.type` está en desuso.
- **Versión de Next.js fijada en 15.4.11.** Con `@cloudflare/next-on-pages` 1.13.x, la 15.5.x rompe las acciones del servidor (Clerk deja de detectar el middleware y devuelve error 500 al guardar). No subas de versión sin probar antes una acción de escritura (crear una familia, editar una celda).
- **CSP:** `next.config.mjs` la envía en modo «solo informe» (`Content-Security-Policy-Report-Only`). Para activarla: usa la app con la consola del navegador abierta (F12); si no aparecen avisos «[Report Only] Refused to…», cambia esa clave por `Content-Security-Policy`. Si aparece alguno, añade el dominio indicado a la directiva correspondiente antes de activarla.
