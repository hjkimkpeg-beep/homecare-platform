import { jsonb, pgTable, serial, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { servicePackagesTable } from "./packages";

export const packageAiVideosTable = pgTable("package_ai_videos", {
  id: serial("id").primaryKey(),
  packageId: uuid("package_id")
    .notNull()
    .unique()
    .references(() => servicePackagesTable.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  script: jsonb("script"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PackageAiVideo = typeof packageAiVideosTable.$inferSelect;
