import { pgTable, uuid, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ordersTable } from "./orders";
import { partnerProfilesTable } from "./partners";

export const assignmentStatusEnum = pgEnum("assignment_status", [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
  "completed",
]);

export const jobAssignmentsTable = pgTable("job_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => ordersTable.id),
  partnerId: uuid("partner_id").notNull().references(() => partnerProfilesTable.id),
  status: assignmentStatusEnum("status").notNull().default("pending"),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJobAssignmentSchema = createInsertSchema(jobAssignmentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertJobAssignment = z.infer<typeof insertJobAssignmentSchema>;
export type JobAssignment = typeof jobAssignmentsTable.$inferSelect;
