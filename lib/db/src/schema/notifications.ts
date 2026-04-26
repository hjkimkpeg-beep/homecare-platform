import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notificationTypeEnum = pgEnum("notification_type", [
  "board_reply",
  "order_created",
  "order_assigned",
  "order_status_changed",
  "project_status_changed",
  "partner_approved",
  "partner_rejected",
  "contract_pending",
  "general",
]);

export const smsNotificationsTable = pgTable("sms_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: notificationTypeEnum("type").notNull().default("general"),
  recipientPhone: varchar("recipient_phone", { length: 20 }).notNull(),
  recipientName: varchar("recipient_name", { length: 100 }),
  messageContent: text("message_content").notNull(),
  isSent: boolean("is_sent").notNull().default(false),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSmsNotificationSchema = createInsertSchema(smsNotificationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSmsNotification = z.infer<typeof insertSmsNotificationSchema>;
export type SmsNotification = typeof smsNotificationsTable.$inferSelect;
