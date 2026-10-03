"use server";
import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { expenseMonthlyEntry, expenseCategory, family, itemArchive, userPreference, yearLock } from "@/db/schema";

// Cada función exportada de este archivo es un endpoint público: se autentica, se valida la entrada
// en tiempo de ejecución (los tipos de TypeScript no protegen frente a peticiones manipuladas) y se
// comprueba que los identificadores pertenecen al usuario o son globales.

type Tipo = "FIJO" | "VARIABLE" | "DISCRECIONAL";
const TIPOS: readonly Tipo[] = ["FIJO", "VARIABLE", "DISCRECIONAL"];
const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "MXN", "ARS", "COP", "CLP", "PEN", "BRL"] as const;

// Límites (D1 admite como máximo 100 parámetros por consulta; las cuotas frenan abusos de almacenamiento)
const MAX_NAME = 80;
const MAX_AMOUNT = 1_000_000_000;
const MAX_CELLS = 60;
const MAX_YEARS = 10;
const MAX_FAMILIES = 100;
const MAX_CATEGORIES = 1000;

function fail(message: string): never { throw new Error(message); }
const asYear = (v: unknown): number => (typeof v === "number" && Number.isInteger(v) && v >= 1990 && v <= 2100 ? v : fail("Año no válido"));
const asMonth = (v: unknown): number => (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 12 ? v : fail("Mes no válido"));
const asAmount = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= MAX_AMOUNT ? Math.round(v * 100) / 100 : fail("Importe no válido"));
const asId = (v: unknown): string => (typeof v === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(v) ? v : fail("Identificador no válido"));
const asTipo = (v: unknown): Tipo => (TIPOS.includes(v as Tipo) ? (v as Tipo) : fail("Tipo no válido"));
const asItemType = (v: unknown): "family" | "category" => (v === "family" || v === "category" ? v : fail("Elemento no válido"));
function asName(v: unknown): string {
  if (typeof v !== "string") fail("Nombre no válido");
  const t = v.trim().replace(/\s+/g, " ");
  return t && t.length <= MAX_NAME ? t : fail("Nombre no válido");
}

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");
  return userId;
}

/** Rechaza la operación si alguno de los años está cerrado (candado). */
async function assertUnlocked(userId: string, years: number[]) {
  const rows = await getDb().select({ year: yearLock.year }).from(yearLock)
    .where(and(eq(yearLock.userId, userId), inArray(yearLock.year, [...new Set(years)])));
  if (rows.length) fail("El año está cerrado");
}

/** Comprueba que todos los gastos existen y son globales o del usuario. */
async function assertVisibleCategories(userId: string, ids: string[]) {
  const unique = [...new Set(ids)];
  const rows = await getDb().select({ id: expenseCategory.id }).from(expenseCategory)
    .where(and(inArray(expenseCategory.id, unique), or(isNull(expenseCategory.userId), eq(expenseCategory.userId, userId))));
  if (rows.length !== unique.length) fail("Gasto no válido");
}

async function assertVisibleFamily(userId: string, id: string) {
  const rows = await getDb().select({ id: family.id }).from(family)
    .where(and(eq(family.id, id), or(isNull(family.userId), eq(family.userId, userId))));
  if (rows.length !== 1) fail("Familia no válida");
}

/** Familias, gastos e importes del año. Oculta lo dado de baja desde ese año (o antes). */
export async function loadYear(yearInput: number) {
  const userId = await requireUser();
  const year = asYear(yearInput);
  const db = getDb();
  const [fams, cats, entries, archives, prefs, locks, dataYears] = await db.batch([
    db.select().from(family).where(or(isNull(family.userId), eq(family.userId, userId))),
    db.select().from(expenseCategory).where(or(isNull(expenseCategory.userId), eq(expenseCategory.userId, userId))),
    db.select().from(expenseMonthlyEntry).where(and(eq(expenseMonthlyEntry.userId, userId), eq(expenseMonthlyEntry.year, year))),
    db.select().from(itemArchive).where(eq(itemArchive.userId, userId)),
    db.select().from(userPreference).where(eq(userPreference.userId, userId)),
    db.select().from(yearLock).where(and(eq(yearLock.userId, userId), eq(yearLock.year, year))),
    db.selectDistinct({ year: expenseMonthlyEntry.year }).from(expenseMonthlyEntry).where(eq(expenseMonthlyEntry.userId, userId)),
  ]);
  const gone = (type: string, id: string) => archives.some((a) => a.itemType === type && a.itemId === id && a.fromYear <= year);
  const families = fams.filter((f) => !gone("family", f.id));
  const ok = new Set(families.map((f) => f.id));
  const categories = cats.filter((c) => ok.has(c.familyId) && !gone("category", c.id));
  return {
    families, categories, entries, currency: prefs[0]?.currency ?? "EUR",
    locked: locks.length > 0,
    years: dataYears.map((r) => r.year).filter((y) => y !== year).sort((a, b) => b - a), // años con datos, para copiar
  };
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
export async function saveCells(cellsInput: { categoryId: string; year: number; month: number; amount: number }[]) {
  const userId = await requireUser();
  if (!Array.isArray(cellsInput) || cellsInput.length === 0 || cellsInput.length > MAX_CELLS) fail("Datos no válidos");
  const cells = cellsInput.map((c) => ({ categoryId: asId(c?.categoryId), year: asYear(c?.year), month: asMonth(c?.month), amount: asAmount(c?.amount) }));
  await assertVisibleCategories(userId, cells.map((c) => c.categoryId));
  await assertUnlocked(userId, cells.map((c) => c.year));
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
  if (!Array.isArray(i?.months) || i.months.length === 0 || i.months.length > 12) fail("Meses no válidos");
  const months = [...new Set(i.months.map(asMonth))];
  if (i.mode !== "repeat" && i.mode !== "split") fail("Modo no válido");
  const amount = asAmount(i.amount);
  const per = i.mode === "split" ? Math.round((amount / months.length) * 100) / 100 : amount;
  await saveCells(months.map((m) => ({ categoryId: i.categoryId, year: i.year, month: m, amount: per })));
}

export async function createFamily(nameInput: string) {
  const userId = await requireUser();
  const name = asName(nameInput);
  const db = getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(family).where(eq(family.userId, userId));
  if (n >= MAX_FAMILIES) fail("Has alcanzado el máximo de familias");
  await db.insert(family).values({ name, userId });
}

export async function createCategory(nameInput: string, familyIdInput: string, typeInput: Tipo) {
  const userId = await requireUser();
  const name = asName(nameInput), familyId = asId(familyIdInput), type = asTipo(typeInput);
  await assertVisibleFamily(userId, familyId);
  const db = getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(expenseCategory).where(eq(expenseCategory.userId, userId));
  if (n >= MAX_CATEGORIES) fail("Has alcanzado el máximo de gastos");
  await db.insert(expenseCategory).values({ name, familyId, userId, type });
}

/** Datos para informes: importes de varios años en un solo batch. */
export async function loadReport(yearsInput: number[]) {
  const userId = await requireUser();
  if (!Array.isArray(yearsInput) || yearsInput.length === 0 || yearsInput.length > MAX_YEARS) fail("Años no válidos");
  const years = [...new Set(yearsInput.map(asYear))];
  const db = getDb();
  const [families, categories, entries, prefs] = await db.batch([
    db.select().from(family).where(or(isNull(family.userId), eq(family.userId, userId))),
    db.select().from(expenseCategory).where(or(isNull(expenseCategory.userId), eq(expenseCategory.userId, userId))),
    db.select().from(expenseMonthlyEntry).where(and(eq(expenseMonthlyEntry.userId, userId), inArray(expenseMonthlyEntry.year, years))),
    db.select().from(userPreference).where(eq(userPreference.userId, userId)),
  ]);
  return { families, categories, entries, currency: prefs[0]?.currency ?? "EUR" };
}

/** Solo se pueden modificar elementos propios (los globales por defecto quedan intactos). */
export async function renameFamily(idInput: string, nameInput: string) {
  const userId = await requireUser();
  const id = asId(idInput), name = asName(nameInput);
  await getDb().update(family).set({ name }).where(and(eq(family.id, id), eq(family.userId, userId)));
}

export async function renameCategory(idInput: string, nameInput: string) {
  const userId = await requireUser();
  const id = asId(idInput), name = asName(nameInput);
  await getDb().update(expenseCategory).set({ name }).where(and(eq(expenseCategory.id, id), eq(expenseCategory.userId, userId)));
}

/** Baja desde un año, para elementos propios o por defecto (solo afecta a este usuario). */
export async function archiveItem(itemTypeInput: "family" | "category", itemIdInput: string, fromYearInput: number) {
  const userId = await requireUser();
  const itemType = asItemType(itemTypeInput), itemId = asId(itemIdInput), fromYear = asYear(fromYearInput);
  if (itemType === "family") await assertVisibleFamily(userId, itemId);
  else await assertVisibleCategories(userId, [itemId]);
  await getDb().insert(itemArchive).values({ userId, itemType, itemId, fromYear }).onConflictDoUpdate({
    target: [itemArchive.userId, itemArchive.itemType, itemArchive.itemId],
    set: { fromYear: sql`excluded.from_year` },
  });
}

export async function restoreItem(itemTypeInput: "family" | "category", itemIdInput: string) {
  const userId = await requireUser();
  const itemType = asItemType(itemTypeInput), itemId = asId(itemIdInput);
  await getDb().delete(itemArchive).where(and(eq(itemArchive.userId, userId), eq(itemArchive.itemType, itemType), eq(itemArchive.itemId, itemId)));
}

export async function setCategoryType(idInput: string, typeInput: Tipo) {
  const userId = await requireUser();
  const id = asId(idInput), type = asTipo(typeInput);
  await getDb().update(expenseCategory).set({ type }).where(and(eq(expenseCategory.id, id), eq(expenseCategory.userId, userId)));
}

/** Moneda del usuario (EUR por defecto). No lanza error si no hay sesión. */
export async function getCurrency(): Promise<string> {
  const { userId } = await auth();
  if (!userId) return "EUR";
  const rows = await getDb().select().from(userPreference).where(eq(userPreference.userId, userId));
  return rows[0]?.currency ?? "EUR";
}

export async function setCurrency(currency: string) {
  const userId = await requireUser();
  if (typeof currency !== "string" || !(CURRENCIES as readonly string[]).includes(currency)) fail("Moneda no admitida");
  await getDb().insert(userPreference).values({ userId, currency }).onConflictDoUpdate({
    target: userPreference.userId,
    set: { currency },
  });
}

/** Cierra (true) o abre (false) un año. Cerrado: no admite cambios en los importes. */
export async function setYearLock(yearInput: number, locked: boolean) {
  const userId = await requireUser();
  const year = asYear(yearInput);
  if (typeof locked !== "boolean") fail("Valor no válido");
  const db = getDb();
  if (locked) await db.insert(yearLock).values({ userId, year }).onConflictDoNothing();
  else await db.delete(yearLock).where(and(eq(yearLock.userId, userId), eq(yearLock.year, year)));
}

/** Pone a cero un año: elimina todos sus importes. */
export async function resetYear(yearInput: number) {
  const userId = await requireUser();
  const year = asYear(yearInput);
  await assertUnlocked(userId, [year]);
  await getDb().delete(expenseMonthlyEntry).where(and(eq(expenseMonthlyEntry.userId, userId), eq(expenseMonthlyEntry.year, year)));
}

/** Sustituye los importes de `to` por los de `from`, en una sola operación atómica.
 *  No copia los gastos ni familias que estén dados de baja en el año de destino. */
export async function copyYear(fromInput: number, toInput: number) {
  const userId = await requireUser();
  const from = asYear(fromInput), to = asYear(toInput);
  if (from === to) fail("El año de origen y el de destino deben ser distintos");
  await assertUnlocked(userId, [to]);
  const db = getDb();
  await db.batch([
    db.delete(expenseMonthlyEntry).where(and(eq(expenseMonthlyEntry.userId, userId), eq(expenseMonthlyEntry.year, to))),
    db.run(sql`INSERT INTO expense_monthly_entry (id, expense_category_id, year, month, amount, user_id)
      SELECT lower(hex(randomblob(16))), e.expense_category_id, ${to}, e.month, e.amount, e.user_id
      FROM expense_monthly_entry e
      JOIN expense_category c ON c.id = e.expense_category_id
      WHERE e.user_id = ${userId} AND e.year = ${from}
        AND NOT EXISTS (SELECT 1 FROM item_archive a WHERE a.user_id = e.user_id AND a.item_type = 'category' AND a.item_id = c.id AND a.from_year <= ${to})
        AND NOT EXISTS (SELECT 1 FROM item_archive a WHERE a.user_id = e.user_id AND a.item_type = 'family' AND a.item_id = c.family_id AND a.from_year <= ${to})`),
  ]);
}
