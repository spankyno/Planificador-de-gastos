# Spending Planner

Planificador de gastos anuales: una grilla de gastos por meses, agrupados en familias (Fijo, Variable, Discrecional), con totales calculados al instante.

**Stack:** Next.js (App Router, edge runtime) · Cloudflare Pages · Cloudflare D1 + Drizzle ORM · Clerk · Tailwind CSS · Recharts.

## Estado

| Función | Estado |
|---|---|
| Grilla anual editable con totales y modo oscuro | Hecho | 
| Periodificación (repetir / prorratear en meses) | Hecho |
| Login con Clerk y rutas protegidas | Hecho |
| Formulario de familias y gastos propios | Pendiente (acciones de servidor listas) |
| Informes y comparativa interanual (Recharts) | Pendiente |

## Estructura

```
├── db/seed.sql              # Familias y gastos globales
├── docs/DATABASE.md         # Cómo crear las tablas en D1
├── migrations/0000_init.sql # Esquema inicial (se aplica con wrangler)
├── src/
│   ├── app/                 # Páginas, layout, server actions, login
│   ├── components/Grid.tsx  # Grilla matricial
│   ├── db/                  # Esquema Drizzle y conexión a D1
│   └── middleware.ts        # Protección de rutas (Clerk)
├── wrangler.toml            # Binding D1 y config de Pages
└── package.json
```

## Puesta en marcha local

```bash
npm install
cp .env.example .env.local          # claves de Clerk
cp .dev.vars.example .dev.vars
# Crea la base de datos y las tablas: ver docs/DATABASE.md
npm run dev
```

`next dev` usa una copia local de D1, así que primero aplica las migraciones con `--local`.

## Despliegue en Cloudflare (importando este repo)

1. Sube el repo a GitHub.
2. En Cloudflare: **Workers & Pages → Create → Pages → Connect to Git** y elige el repo.
3. Configuración de build:
   - **Framework preset:** None
   - **Build command:** `npx @cloudflare/next-on-pages`
   - **Build output directory:** `.vercel/output/static`
   - **Variable de entorno:** `NODE_VERSION` = `20`
4. En **Settings → Variables and Secrets** añade `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`.
5. En **Settings → Bindings** añade un binding **D1 database**: nombre `DB`, base `spending-planner-db`. Si `wrangler.toml` ya tiene el `database_id` correcto, Pages lo toma de ahí.
6. En **Settings → Runtime**, añade el compatibility flag `nodejs_compat` (producción y preview).
7. Crea las tablas en la base remota (ver `docs/DATABASE.md`) y vuelve a desplegar.

En Clerk, añade el dominio `*.pages.dev` (o el tuyo) como dominio permitido.

## Notas

- Todas las rutas deben declarar `export const runtime = "edge"` (requisito de `next-on-pages`).
- Los importes se guardan por usuario, gasto, año y mes; el índice único `uniq_cell` permite el upsert por celda.
- Los gastos con `user_id` nulo son globales y los ve todo el mundo; los propios solo los ve su autor.
