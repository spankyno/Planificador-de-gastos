import type { DrizzleD1Database } from "drizzle-orm/d1";
import { and, eq, isNull, or } from "drizzle-orm";
import { expenseCategory, expenseMonthlyEntry, itemArchive } from "../db/schema";

// D1 admite como máximo 100 parámetros por consulta; cada fila usa 6 (id, gasto, año, mes, importe, usuario)
const ROWS_PER_INSERT = 16;
const MAX_STATEMENTS = 100;

/** Sustituye los importes de `to` por los de `from` en una sola operación atómica (db.batch).
 *  No copia los gastos ni familias dados de baja en el año de destino. */
export async function copyYearEntries(db: DrizzleD1Database<any>, userId: string, from: number, to: number, percent = 0, onlyType: string | null = null) {
  const [src, archives, cats] = await db.batch([
    db.select().from(expenseMonthlyEntry).where(and(eq(expenseMonthlyEntry.userId, userId), eq(expenseMonthlyEntry.year, from))),
    db.select().from(itemArchive).where(eq(itemArchive.userId, userId)),
    db.select({ id: expenseCategory.id, familyId: expenseCategory.familyId, type: expenseCategory.type }).from(expenseCategory)
      .where(or(isNull(expenseCategory.userId), eq(expenseCategory.userId, userId))),
  ]);

  const gone = (type: string, id: string) => archives.some((a) => a.itemType === type && a.itemId === id && a.fromYear <= to);
  const familyOf = new Map(cats.map((c) => [c.id, c.familyId]));
  const typeOf = new Map(cats.map((c) => [c.id, c.type ?? "VARIABLE"]));
  const factor = 1 + percent / 100;
  // El ajuste se aplica a todos los gastos o solo a los del tipo elegido; el resto se copia sin cambios
  const adjust = (id: string, amount: number) => (onlyType === null || typeOf.get(id) === onlyType ? Math.round(amount * factor * 100) / 100 : amount);
  const rows = src
    .filter((e) => familyOf.has(e.expenseCategoryId) && !gone("category", e.expenseCategoryId) && !gone("family", familyOf.get(e.expenseCategoryId)!))
    .map((e) => ({ userId, expenseCategoryId: e.expenseCategoryId, year: to, month: e.month, amount: adjust(e.expenseCategoryId, e.amount) }));

  const ops: any[] = [db.delete(expenseMonthlyEntry).where(and(eq(expenseMonthlyEntry.userId, userId), eq(expenseMonthlyEntry.year, to)))];
  for (let i = 0; i < rows.length; i += ROWS_PER_INSERT) ops.push(db.insert(expenseMonthlyEntry).values(rows.slice(i, i + ROWS_PER_INSERT)));
  if (ops.length > MAX_STATEMENTS) throw new Error("Demasiados importes para copiar de una sola vez");

  await db.batch(ops as [any, ...any[]]);
  return rows.length;
}
