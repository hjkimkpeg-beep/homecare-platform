import { integer, pgTable, serial, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { servicePackagesTable } from "./packages";

export const serviceManualsTable = pgTable("service_manuals", {
  id: serial("id").primaryKey(),
  packageId: uuid("package_id")
    .notNull()
    .references(() => servicePackagesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  fileType: varchar("file_type", { length: 20 }).notNull(),
  objectPath: text("object_path").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertServiceManualSchema = createInsertSchema(serviceManualsTable).omit({
  id: true,
  createdAt: true,
});

export type ServiceManual = typeof serviceManualsTable.$inferSelect;
export type InsertServiceManual = z.infer<typeof insertServiceManualSchema>;
