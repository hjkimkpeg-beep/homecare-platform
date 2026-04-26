import { pgTable, uuid, varchar, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { servicePackagesTable } from "./packages";
import { ordersTable } from "./orders";
import { partnerProfilesTable } from "./partners";
import { usersTable } from "./users";

export const projectStatusEnum = pgEnum("project_status", [
  "planning",
  "in_progress",
  "completed",
  "cancelled",
]);

export const serviceProjectsTable = pgTable("service_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 200 }).notNull(),
  orderId: uuid("order_id").references(() => ordersTable.id),
  packageId: uuid("package_id").references(() => servicePackagesTable.id),
  applicantName: varchar("applicant_name", { length: 100 }).notNull(),
  applicantPhone: varchar("applicant_phone", { length: 20 }).notNull(),
  applicantAddress: varchar("applicant_address", { length: 300 }),
  serviceContent: text("service_content"),
  partnerId: uuid("partner_id").references(() => partnerProfilesTable.id),
  notes: text("notes"),
  status: projectStatusEnum("status").notNull().default("planning"),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertServiceProjectSchema = createInsertSchema(serviceProjectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertServiceProject = z.infer<typeof insertServiceProjectSchema>;
export type ServiceProject = typeof serviceProjectsTable.$inferSelect;
