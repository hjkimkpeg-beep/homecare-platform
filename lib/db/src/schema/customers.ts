import { pgTable, uuid, varchar, text, timestamp, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const customerTypeEnum = pgEnum("customer_type", ["single", "senior", "guardian", "landlord", "manager"]);
export const preferredContactEnum = pgEnum("preferred_contact", ["phone", "sms", "kakao", "email"]);

export const customerProfilesTable = pgTable("customer_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  customerType: customerTypeEnum("customer_type").notNull().default("single"),
  preferredContactMethod: preferredContactEnum("preferred_contact_method").notNull().default("phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customerAddressesTable = pgTable("customer_addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull().references(() => customerProfilesTable.id),
  label: varchar("label", { length: 50 }).notNull().default("집"),
  roadAddress: varchar("road_address", { length: 255 }).notNull(),
  detailAddress: varchar("detail_address", { length: 255 }).notNull(),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  accessNote: text("access_note"),
  isDefault: boolean("is_default").notNull().default(false),
});

export const insertCustomerProfileSchema = createInsertSchema(customerProfilesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCustomerProfile = z.infer<typeof insertCustomerProfileSchema>;
export type CustomerProfile = typeof customerProfilesTable.$inferSelect;

export const insertCustomerAddressSchema = createInsertSchema(customerAddressesTable).omit({ id: true });
export type InsertCustomerAddress = z.infer<typeof insertCustomerAddressSchema>;
export type CustomerAddress = typeof customerAddressesTable.$inferSelect;
