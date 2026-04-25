import { integer, jsonb, pgTable, serial, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
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

export const packageExternalVideosTable = pgTable("package_external_videos", {
  id: serial("id").primaryKey(),
  packageId: uuid("package_id")
    .notNull()
    .references(() => servicePackagesTable.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  videoType: varchar("video_type", { length: 20 }).notNull().default("url"),
  videoUrl: text("video_url"),
  objectPath: text("object_path"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PackageExternalVideo = typeof packageExternalVideosTable.$inferSelect;
