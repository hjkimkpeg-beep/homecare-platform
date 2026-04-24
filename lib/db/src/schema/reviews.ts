import { pgTable, uuid, integer, text, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ordersTable } from "./orders";
import { customerProfilesTable } from "./customers";

export const asRequestStatusEnum = pgEnum("as_request_status", [
  "pending",
  "assigned",
  "in_progress",
  "completed",
  "rejected",
]);

export const reviewsTable = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => ordersTable.id).unique(),
  customerId: uuid("customer_id").notNull().references(() => customerProfilesTable.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const asRequestsTable = pgTable("as_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => ordersTable.id),
  customerId: uuid("customer_id").notNull().references(() => customerProfilesTable.id),
  reason: varchar("reason", { length: 200 }).notNull(),
  description: text("description"),
  status: asRequestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;

export const insertAsRequestSchema = createInsertSchema(asRequestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAsRequest = z.infer<typeof insertAsRequestSchema>;
export type AsRequest = typeof asRequestsTable.$inferSelect;
