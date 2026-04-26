import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const diagnosisProblemTypeEnum = pgEnum("diagnosis_problem_type", [
  "leak",
  "drain",
  "boiler",
  "aircon",
  "electrical",
  "other",
]);

export const diagnosisStatusEnum = pgEnum("diagnosis_status", [
  "received",
  "reviewing",
  "visit_scheduled",
  "completed",
  "cancelled",
]);

export const remoteDiagnosisTable = pgTable("remote_diagnosis_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  address: varchar("address", { length: 300 }).notNull(),
  preferredDate: varchar("preferred_date", { length: 20 }),
  isUrgent: varchar("is_urgent", { length: 5 }).notNull().default("no"),
  problemType: diagnosisProblemTypeEnum("problem_type").notNull(),
  description: text("description"),
  checklistAnswers: jsonb("checklist_answers"),
  uploadedFiles: jsonb("uploaded_files"),
  diagnosisResult: jsonb("diagnosis_result"),
  estimatedCost: varchar("estimated_cost", { length: 100 }),
  urgency: varchar("urgency", { length: 50 }),
  status: diagnosisStatusEnum("status").notNull().default("received"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDiagnosisSchema = createInsertSchema(remoteDiagnosisTable).omit({
  id: true,
  diagnosisResult: true,
  estimatedCost: true,
  urgency: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDiagnosis = z.infer<typeof insertDiagnosisSchema>;
export type RemoteDiagnosis = typeof remoteDiagnosisTable.$inferSelect;
