"use server";
import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { expenseMonthlyEntry, expenseCategory, family } from "@/db/schema";

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");
  return userId;
}

/** Familias, gastos (globales + propios) e importes del año, en un solo batch. */
export async function loadYear(year: number) {
  const userId = await requireUser();
  const db = getDb();
  const [families, categories, entries] = await db.batch([
    db.select().from(family).where(or(isNull(family.userId), eq(family.userId, userId))),
    db.select().from(expenseCategory).where(or(isNull(expenseCategory.userId), eq(expenseCategory.userId, userId))),
    db.select().from(expenseMonthlyEntry).where(and(eq(expenseMonthlyEntry.userId, userId), eq(expenseMonthlyEntry.year, year))),
  ]);
  return { families, categories, entries };
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
