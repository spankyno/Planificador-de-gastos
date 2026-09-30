# Crear las tablas en Cloudflare D1

Requisitos: Node 20+, `npm install` hecho y sesión iniciada en Cloudflare (`npx wrangler login`).

## 1. Crear la base de datos

```bash
npx wrangler d1 create spending-planner-db
```

El comando imprime un `database_id`. Cópialo en `wrangler.toml`, en el campo `database_id`.

## 2. Aplicar el esquema

`migrations/0000_init.sql` crea las cuatro tablas y sus índices.

```bash
# Base local (para npm run dev / preview)
npm run db:migrate:local

# Base remota (producción)
npm run db:migrate:remote
```

Wrangler apunta en la tabla `d1_migrations` qué archivos ya se aplicaron, así que puedes repetir el comando sin duplicar nada.

## 3. Cargar los datos por defecto

`db/seed.sql` inserta 4 familias y 8 gastos globales. Usa `INSERT OR IGNORE`, por lo que se puede ejecutar varias veces.

```bash
npm run db:seed:local
npm run db:seed:remote
```

## 4. Comprobar

```bash
npx wrangler d1 execute spending-planner-db --remote --command "SELECT name, type FROM family"
```

Debe devolver las 4 familias.

## Tablas

| Tabla | Para qué sirve | Claves |
|---|---|---|
| `user_preference` | Moneda por usuario | PK `user_id` |
| `family` | Familias de gasto y su tipo | PK `id`; `user_id` nulo = global |
| `expense_category` | Gastos dentro de cada familia | PK `id`; FK `family_id` |
| `expense_monthly_entry` | Importe por gasto, año y mes | PK `id`; FK `expense_category_id`; único (`user_id`, `expense_category_id`, `year`, `month`) |

## Cambiar el esquema más adelante

1. Edita `src/db/schema.ts`.
2. Ejecuta `npm run db:generate`: Drizzle crea un nuevo archivo `migrations/000X_*.sql`.
3. Aplícalo con `db:migrate:local` y después con `db:migrate:remote`.

Si el nuevo archivo generado choca con `0000_init.sql` (por ejemplo, intenta recrear tablas existentes), quita del nuevo archivo lo que ya existe y deja solo el cambio.
