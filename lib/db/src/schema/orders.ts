import { pgTable, uuid, varchar, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { servicePackagesTable } from "./packages";
import { customerProfilesTable } from "./customers";

export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card"]);

export const orderStatusEnum = pgEnum("order_status", [
  "requested",
  "paid",
  "pending_assignment",
  "assigned",
  "en_route",
  "arrived",
  "in_progress",
  "inspection_pending",
  "inspection_approved",
  "completed",
  "cancelled",
  "as_requested",
]);

export const ordersTable = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: varchar("order_number", { length: 20 }).notNull().unique(),
  customerId: uuid("customer_id").notNull().references(() => customerProfilesTable.id),
  packageId: uuid("package_id").notNull().references(() => servicePackagesTable.id),
  packageName: varchar("package_name", { length: 100 }).notNull(),
  status: orderStatusEnum("status").notNull().default("pending_assignment"),
  totalPrice: integer("total_price").notNull(),
  roadAddress: varchar("road_address", { length: 255 }).notNull(),
  detailAddress: varchar("detail_address", { length: 255 }).notNull(),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
  requestNote: text("request_note"),
  paymentMethod: paymentMethodEnum("payment_method"),
  refundBankName: varchar("refund_bank_name", { length: 50 }),
  refundAccountNumber: varchar("refund_account_number", { length: 30 }),
  refundAccountHolder: varchar("refund_account_holder", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const orderStatusLogsTable = pgTable("order_status_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => ordersTable.id),
  status: orderStatusEnum("status").notNull(),
  note: text("note"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;

export const insertOrderStatusLogSchema = createInsertSchema(orderStatusLogsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOrderStatusLog = z.infer<typeof insertOrderStatusLogSchema>;
export type OrderStatusLog = typeof orderStatusLogsTable.$inferSelect;
