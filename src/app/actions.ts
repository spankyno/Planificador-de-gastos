"use server";
import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { expenseMonthlyEntry, expenseCategory, family, itemArchive } from "@/db/schema";

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");
  return userId;
}

/** Familias, gastos e importes del año. Oculta lo dado de baja desde ese año (o antes). */
export async function loadYear(year: number) {
  const userId = await requireUser();
  const db = getDb();
  const [fams, cats, entries, archives] = await db.batch([
    db.select().from(family).where(or(isNull(family.userId), eq(family.userId, userId))),
    db.select().from(expenseCategory).where(or(isNull(expenseCategory.userId), eq(expenseCategory.userId, userId))),
    db.select().from(expenseMonthlyEntry).where(and(eq(expenseMonthlyEntry.userId, userId), eq(expenseMonthlyEntry.year, year))),
    db.select().from(itemArchive).where(eq(itemArchive.userId, userId)),
  ]);
  const gone = (type: string, id: string) => archives.some((a) => a.itemType === type && a.itemId === id && a.fromYear <= year);
  const families = fams.filter((f) => !gone("family", f.id));
  const ok = new Set(families.map((f) => f.id));
  const categories = cats.filter((c) => ok.has(c.familyId) && !gone("category", c.id));
  return { families, categories, entries };
}

/** Estructura completa (incluye bajas) para la pantalla de gestión. */
export async function loadStructure() {
  const userId = await requireUser();
  const db = getDb();
  const [families, categories, archives] = await db.batch([
    db.select().from(family).where(or(isNull(family.userId), eq(family.userId, userId))),
    db.select().from(expenseCategory).where(or(isNull(expenseCategory.userId), eq(expenseCategory.userId, userId))),
    db.select().from(itemArchive).where(eq(itemArchive.userId, userId)),
  ]);
  return { families, categories, archives };
}

/** Upsert de una o varias celdas en un único db.batch (una sola ida a D1). */
export async function saveCells(cells: { categoryId: string; year: number; month: number; amount: number }[]) {
  const userId = await requireUser();
  if (!cells.length) return;
  const db = getDb();
  const stmts = cells.map((c) =>
    db.insert(expenseMonthlyEntry)
      .values({ userId, expenseCategoryId: c.categoryId, year: c.year, month: c.month, amount: c.amount })
      .onConflictDoUpdate({
        target: [expenseMonthlyEntry.userId, expenseMonthlyEntry.expenseCategoryId, expenseMonthlyEntry.year, expenseMonthlyEntry.month],
        set: { amount: sql`excluded.amount` },
      })
  );
  await db.batch(stmts as [(typeof stmts)[0], ...(typeof stmts)]);
}

/** Periodificación: "repeat" replica el importe; "split" lo prorratea entre los meses. */
export async function spreadAmount(i: { categoryId: string; year: number; months: number[]; amount: number; mode: "repeat" | "split" }) {
  const per = i.mode === "split" ? Math.round((i.amount / i.months.length) * 100) / 100 : i.amount;
  await saveCells(i.months.map((m) => ({ categoryId: i.categoryId, year: i.year, month: m, amount: per })));
}

export async function createFamily(name: string, type: "FIJO" | "VARIABLE" | "DISCRECIONAL") {
  const userId = await requireUser();
  await getDb().insert(family).values({ name, type, userId });
}

export async function createCategory(name: string, familyId: string) {
  const userId = await requireUser();
  await getDb().insert(expenseCategory).values({ name, familyId, userId });
}

/** Datos para informes: importes de varios años en un solo batch. */
export async function loadReport(years: number[]) {
  const userId = await requireUser();
  const db = getDb();
  const [families, categories, entries] = await db.batch([
    db.select().from(family).where(or(isNull(family.userId), eq(family.userId, userId))),
    db.select().from(expenseCategory).where(or(isNull(expenseCategory.userId), eq(expenseCategory.userId, userId))),
    db.select().from(expenseMonthlyEntry).where(and(eq(expenseMonthlyEntry.userId, userId), inArray(expenseMonthlyEntry.year, years))),
  ]);
  return { families, categories, entries };
}

/** Solo se pueden modificar elementos propios (los globales por defecto quedan intactos). */
export async function renameFamily(id: string, name: string, type: "FIJO" | "VARIABLE" | "DISCRECIONAL") {
  const userId = await requireUser();
  await getDb().update(family).set({ name, type }).where(and(eq(family.id, id), eq(family.userId, userId)));
}

export async function renameCategory(id: string, name: string) {
  const userId = await requireUser();
  await getDb().update(expenseCategory).set({ name }).where(and(eq(expenseCategory.id, id), eq(expenseCategory.userId, userId)));
}

/** Baja desde un año, para elementos propios o por defecto (solo afecta a este usuario). */
export async function archiveItem(itemType: "family" | "category", itemId: string, fromYear: number) {
  const userId = await requireUser();
  await getDb().insert(itemArchive).values({ userId, itemType, itemId, fromYear }).onConflictDoUpdate({
    target: [itemArchive.userId, itemArchive.itemType, itemArchive.itemId],
    set: { fromYear: sql`excluded.from_year` },
  });
}

export async function restoreItem(itemType: "family" | "category", itemId: string) {
  const userId = await requireUser();
  await getDb().delete(itemArchive).where(and(eq(itemArchive.userId, userId), eq(itemArchive.itemType, itemType), eq(itemArchive.itemId, itemId)));
}
