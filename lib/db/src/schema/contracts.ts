import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { servicePackagesTable } from "./packages";
import { partnerProfilesTable } from "./partners";

export const partnerContractStatusEnum = pgEnum("partner_contract_status", [
  "pending",
  "agreed",
  "rejected",
]);

export const contractTemplatesTable = pgTable("contract_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  packageId: uuid("package_id").references(() => servicePackagesTable.id),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  version: varchar("version", { length: 20 }).notNull().default("1.0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const partnerContractAgreementsTable = pgTable("partner_contract_agreements", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerId: uuid("partner_id").notNull().references(() => partnerProfilesTable.id),
  templateId: uuid("template_id").notNull().references(() => contractTemplatesTable.id),
  status: partnerContractStatusEnum("status").notNull().default("pending"),
  agreedAt: timestamp("agreed_at", { withTimezone: true }),
  agreedIp: varchar("agreed_ip", { length: 45 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertContractTemplateSchema = createInsertSchema(contractTemplatesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertContractTemplate = z.infer<typeof insertContractTemplateSchema>;
export type ContractTemplate = typeof contractTemplatesTable.$inferSelect;

export const insertPartnerContractAgreementSchema = createInsertSchema(partnerContractAgreementsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPartnerContractAgreement = z.infer<typeof insertPartnerContractAgreementSchema>;
export type PartnerContractAgreement = typeof partnerContractAgreementsTable.$inferSelect;
