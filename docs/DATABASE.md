# Crear y actualizar las tablas en Cloudflare D1

Requisitos: Node 20+, `npm install` hecho y sesión iniciada en Cloudflare (`npx wrangler login`).

## 1. Crear la base de datos

```bash
npx wrangler d1 create spending-planner-db
```

Copia el `database_id` que imprime en `wrangler.toml`.

## 2. Aplicar las migraciones

```bash
npm run db:migrate:local     # base local (npm run dev / preview)
npm run db:migrate:remote    # base remota (producción)
```

Wrangler apunta en `d1_migrations` qué archivos ya se aplicaron, así que puedes repetir el comando sin duplicar nada.

| Migración | Qué hace |
|---|---|
| `0000_init.sql` | Crea las 4 tablas iniciales y sus índices |
| `0001_archive.sql` | Columna `archived_from_year` en `expense_category` (ya sin uso) |
| `0002_item_archive.sql` | Tabla `item_archive` (bajas por usuario) y traslada las bajas de 0001 |
| `0003_category_type.sql` | Columna `type` en `expense_category` (el tipo pasa de la familia al gasto) |
| `0004_year_lock.sql` | Tabla `year_lock` (años cerrados con candado) |

Si no usas la línea de comandos, pega el contenido de cada archivo, **en orden**, en la consola SQL de D1 del panel de Cloudflare. Hazlo antes de desplegar una versión que dependa de la migración.

## 3. Cargar los datos por defecto

`db/seed.sql` inserta 4 familias y 8 gastos globales (con su tipo). Usa `INSERT OR IGNORE`: se puede repetir sin duplicar.

```bash
npm run db:seed:local
npm run db:seed:remote
```

## 4. Comprobar

```bash
npx wrangler d1 execute spending-planner-db --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
npx wrangler d1 execute spending-planner-db --remote --command "SELECT name FROM pragma_table_info('expense_category')"
```

Deben aparecer las tablas `user_preference`, `family`, `expense_category`, `expense_monthly_entry` e `item_archive`, `year_lock`, y la columna `type` en `expense_category`.

## Tablas

| Tabla | Para qué sirve | Claves |
|---|---|---|
| `user_preference` | Moneda por usuario | PK `user_id` |
| `family` | Familias de gasto | PK `id`; `user_id` nulo = global |
| `expense_category` | Gastos dentro de cada familia, con su tipo | PK `id`; FK `family_id`; `type` FIJO/VARIABLE/DISCRECIONAL |
| `expense_monthly_entry` | Importe por gasto, año y mes | PK `id`; FK `expense_category_id`; único (`user_id`, `expense_category_id`, `year`, `month`) |
| `item_archive` | Bajas por usuario de familias y gastos | PK (`user_id`, `item_type`, `item_id`); `from_year` |
| `year_lock` | Años cerrados por usuario (sin fila = abierto) | PK (`user_id`, `year`) |

## Cambiar el esquema más adelante

1. Edita `src/db/schema.ts`.
2. Escribe una migración nueva en `migrations/` (siguiente número), o genérala con `npm run db:generate` y revísala.
3. Aplícala con `db:migrate:local` y después con `db:migrate:remote` **antes** de desplegar el código que la usa.

SQLite no permite quitar restricciones de una columna sin recrear la tabla; por eso `family.type` sigue existiendo, ignorada por la app.
