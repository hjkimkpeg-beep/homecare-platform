import {
  pgTable,
  serial,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const boardCategoryEnum = pgEnum("board_category", [
  "inquiry",
  "notice",
  "general",
  "complaint",
]);

export const boardStatusEnum = pgEnum("board_status", [
  "open",
  "answered",
  "closed",
]);

export const boardAuthorTypeEnum = pgEnum("board_author_type", [
  "customer",
  "admin",
  "partner",
]);

export const boardPostsTable = pgTable("board_posts", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  authorName: varchar("author_name", { length: 100 }).notNull(),
  authorType: boardAuthorTypeEnum("author_type").notNull().default("customer"),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  category: boardCategoryEnum("category").notNull().default("general"),
  status: boardStatusEnum("status").notNull().default("open"),
  isPinned: boolean("is_pinned").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  isSecret: boolean("is_secret").notNull().default(false),
  contactPhone: varchar("contact_phone", { length: 20 }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const boardCommentsTable = pgTable("board_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => boardPostsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  authorName: varchar("author_name", { length: 100 }).notNull(),
  authorType: boardAuthorTypeEnum("author_type").notNull().default("admin"),
  content: text("content").notNull(),
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
  notificationSent: boolean("notification_sent").notNull().default(false),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const boardNotificationsTable = pgTable("board_notifications", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => boardPostsTable.id, { onDelete: "cascade" }),
  commentId: integer("comment_id").references(() => boardCommentsTable.id, {
    onDelete: "set null",
  }),
  recipientName: varchar("recipient_name", { length: 100 }).notNull(),
  recipientPhone: varchar("recipient_phone", { length: 20 }).notNull(),
  messageContent: text("message_content").notNull(),
  isSent: boolean("is_sent").notNull().default(false),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BoardPost = typeof boardPostsTable.$inferSelect;
export type BoardComment = typeof boardCommentsTable.$inferSelect;
export type BoardNotification = typeof boardNotificationsTable.$inferSelect;
