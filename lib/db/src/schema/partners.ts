import { pgTable, uuid, varchar, integer, decimal, timestamp, pgEnum, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const businessTypeEnum = pgEnum("business_type", ["individual", "business"]);
export const partnerGradeEnum = pgEnum("partner_grade", ["G1", "G2", "G3", "G4", "G5"]);
export const partnerApprovalStatusEnum = pgEnum("partner_approval_status", ["pending", "approved", "rejected", "suspended"]);
export const partnerAvailabilityEnum = pgEnum("partner_availability", ["available", "busy", "offline"]);

export const partnerProfilesTable = pgTable("partner_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  businessType: businessTypeEnum("business_type").notNull().default("individual"),
  grade: partnerGradeEnum("grade").notNull().default("G1"),
  ratingAvg: decimal("rating_avg", { precision: 3, scale: 2 }).notNull().default("0"),
  ratingCount: integer("rating_count").notNull().default(0),
  approvalStatus: partnerApprovalStatusEnum("approval_status").notNull().default("pending"),
  availabilityStatus: partnerAvailabilityEnum("availability_status").notNull().default("available"),
  serviceRadiusKm: integer("service_radius_km").notNull().default(10),
  bankInfoMasked: varchar("bank_info_masked", { length: 100 }),
  approvalNote: text("approval_note"),
  serviceArea: varchar("service_area", { length: 200 }),
  career: text("career"),
  certifications: text("certifications"),
  experienceYears: integer("experience_years").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPartnerProfileSchema = createInsertSchema(partnerProfilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPartnerProfile = z.infer<typeof insertPartnerProfileSchema>;
export type PartnerProfile = typeof partnerProfilesTable.$inferSelect;
