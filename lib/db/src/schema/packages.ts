import { pgTable, uuid, varchar, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const servicePackagesTable = pgTable("service_packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  description: text("description").notNull(),
  basePrice: integer("base_price").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull().default(90),
  asWarrantyDays: integer("as_warranty_days").notNull().default(30),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const packageIncludedItemsTable = pgTable("package_included_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  packageId: uuid("package_id").notNull().references(() => servicePackagesTable.id),
  item: varchar("item", { length: 200 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const packageExcludedItemsTable = pgTable("package_excluded_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  packageId: uuid("package_id").notNull().references(() => servicePackagesTable.id),
  item: varchar("item", { length: 200 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const packageTasksTable = pgTable("package_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  packageId: uuid("package_id").notNull().references(() => servicePackagesTable.id),
  task: varchar("task", { length: 200 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertServicePackageSchema = createInsertSchema(servicePackagesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertServicePackage = z.infer<typeof insertServicePackageSchema>;
export type ServicePackage = typeof servicePackagesTable.$inferSelect;
