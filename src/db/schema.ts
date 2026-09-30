import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const userPreference = sqliteTable("user_preference", {
  userId: text("user_id").primaryKey(),
  currency: text("currency").notNull().default("EUR"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const family = sqliteTable("family", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: text("type", { enum: ["FIJO", "VARIABLE", "DISCRECIONAL"] }).notNull(),
  userId: text("user_id"), // null = familia por defecto global
});

export const expenseCategory = sqliteTable("expense_category", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  familyId: text("family_id").notNull().references(() => family.id),
  userId: text("user_id"), // null = gasto por defecto global
});

export const expenseMonthlyEntry = sqliteTable(
  "expense_monthly_entry",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    expenseCategoryId: text("expense_category_id").notNull().references(() => expenseCategory.id),
    year: integer("year").notNull(),
    month: integer("month").notNull(), // 1-12
    amount: real("amount").notNull().default(0),
    userId: text("user_id").notNull(),
  },
  (t) => ({
    uniq: uniqueIndex("uniq_cell").on(t.userId, t.expenseCategoryId, t.year, t.month),
    byYear: index("idx_user_year").on(t.userId, t.year),
  })
);
