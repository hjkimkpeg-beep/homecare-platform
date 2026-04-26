import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import {
  db,
  contractTemplatesTable,
  partnerContractAgreementsTable,
  partnerProfilesTable,
  servicePackagesTable,
} from "@workspace/db";
import { requireAdmin, requireAuth } from "../middlewares/auth";
import "../lib/session";

function requirePartner(req: any, res: any, next: any) {
  if (!req.session.userId) {
    res.status(401).json({ error: "로그인이 필요합니다" });
    return;
  }
  if (req.session.userRole !== "partner") {
    res.status(403).json({ error: "파트너만 접근할 수 있습니다" });
    return;
  }
  next();
}

const router: IRouter = Router();

router.get("/admin/contracts", requireAdmin, async (_req, res): Promise<void> => {
  const templates = await db
    .select({
      id: contractTemplatesTable.id,
      packageId: contractTemplatesTable.packageId,
      packageName: servicePackagesTable.name,
      title: contractTemplatesTable.title,
      content: contractTemplatesTable.content,
      version: contractTemplatesTable.version,
      isActive: contractTemplatesTable.isActive,
      createdAt: contractTemplatesTable.createdAt,
      updatedAt: contractTemplatesTable.updatedAt,
    })
    .from(contractTemplatesTable)
    .leftJoin(servicePackagesTable, eq(contractTemplatesTable.packageId, servicePackagesTable.id))
    .orderBy(desc(contractTemplatesTable.createdAt));

  res.json(templates);
});

router.post("/admin/contracts", requireAdmin, async (req, res): Promise<void> => {
  const { packageId, title, content, version, isActive } = req.body;

  if (!title?.trim() || !content?.trim()) {
    res.status(400).json({ error: "제목과 내용은 필수입니다" });
    return;
  }

  const [template] = await db
    .insert(contractTemplatesTable)
    .values({
      packageId: packageId || null,
      title: title.trim(),
      content: content.trim(),
      version: version?.trim() || "1.0",
      isActive: isActive !== false,
    })
    .returning();

  res.status(201).json(template);
});

router.patch("/admin/contracts/:templateId", requireAdmin, async (req, res): Promise<void> => {
  const { templateId } = req.params;
  const { packageId, title, content, version, isActive } = req.body;

  const [existing] = await db
    .select({ id: contractTemplatesTable.id })
    .from(contractTemplatesTable)
    .where(eq(contractTemplatesTable.id, templateId));

  if (!existing) {
    res.status(404).json({ error: "계약서 템플릿을 찾을 수 없습니다" });
    return;
  }

  const updates: Record<string, any> = {};
  if (packageId !== undefined) updates.packageId = packageId || null;
  if (title !== undefined) updates.title = title.trim();
  if (content !== undefined) updates.content = content.trim();
  if (version !== undefined) updates.version = version.trim();
  if (isActive !== undefined) updates.isActive = isActive;

  const [updated] = await db
    .update(contractTemplatesTable)
    .set(updates)
    .where(eq(contractTemplatesTable.id, templateId))
    .returning();

  res.json(updated);
});

router.delete("/admin/contracts/:templateId", requireAdmin, async (req, res): Promise<void> => {
  const { templateId } = req.params;
  await db.delete(contractTemplatesTable).where(eq(contractTemplatesTable.id, templateId));
  res.json({ ok: true });
});

router.get("/contracts/active", requireAuth, async (_req, res): Promise<void> => {
  const templates = await db
    .select({
      id: contractTemplatesTable.id,
      packageId: contractTemplatesTable.packageId,
      packageName: servicePackagesTable.name,
      title: contractTemplatesTable.title,
      content: contractTemplatesTable.content,
      version: contractTemplatesTable.version,
      isActive: contractTemplatesTable.isActive,
      createdAt: contractTemplatesTable.createdAt,
      updatedAt: contractTemplatesTable.updatedAt,
    })
    .from(contractTemplatesTable)
    .leftJoin(servicePackagesTable, eq(contractTemplatesTable.packageId, servicePackagesTable.id))
    .where(eq(contractTemplatesTable.isActive, true))
    .orderBy(desc(contractTemplatesTable.createdAt));

  res.json(templates);
});

router.get("/partner/contracts", requirePartner, async (req, res): Promise<void> => {
  const userId = req.session.userId;
  const [partner] = await db
    .select({ id: partnerProfilesTable.id })
    .from(partnerProfilesTable)
    .where(eq(partnerProfilesTable.userId, userId));

  if (!partner) {
    res.status(404).json({ error: "파트너 프로필을 찾을 수 없습니다" });
    return;
  }

  const agreements = await db
    .select({
      id: partnerContractAgreementsTable.id,
      partnerId: partnerContractAgreementsTable.partnerId,
      templateId: partnerContractAgreementsTable.templateId,
      templateTitle: contractTemplatesTable.title,
      status: partnerContractAgreementsTable.status,
      agreedAt: partnerContractAgreementsTable.agreedAt,
      createdAt: partnerContractAgreementsTable.createdAt,
    })
    .from(partnerContractAgreementsTable)
    .leftJoin(contractTemplatesTable, eq(partnerContractAgreementsTable.templateId, contractTemplatesTable.id))
    .where(eq(partnerContractAgreementsTable.partnerId, partner.id))
    .orderBy(desc(partnerContractAgreementsTable.createdAt));

  res.json(agreements);
});

router.post("/partner/contracts", requirePartner, async (req, res): Promise<void> => {
  const userId = req.session.userId;
  const { templateId } = req.body;

  if (!templateId) {
    res.status(400).json({ error: "계약서 ID가 필요합니다" });
    return;
  }

  const [partner] = await db
    .select({ id: partnerProfilesTable.id })
    .from(partnerProfilesTable)
    .where(eq(partnerProfilesTable.userId, userId));

  if (!partner) {
    res.status(404).json({ error: "파트너 프로필을 찾을 수 없습니다" });
    return;
  }

  const [existing] = await db
    .select({ id: partnerContractAgreementsTable.id })
    .from(partnerContractAgreementsTable)
    .where(
      and(
        eq(partnerContractAgreementsTable.partnerId, partner.id),
        eq(partnerContractAgreementsTable.templateId, templateId)
      )
    );

  if (existing) {
    const [updated] = await db
      .update(partnerContractAgreementsTable)
      .set({ status: "agreed", agreedAt: new Date() })
      .where(eq(partnerContractAgreementsTable.id, existing.id))
      .returning();
    res.json(updated);
    return;
  }

  const [agreement] = await db
    .insert(partnerContractAgreementsTable)
    .values({
      partnerId: partner.id,
      templateId,
      status: "agreed",
      agreedAt: new Date(),
    })
    .returning();

  res.json(agreement);
});

export default router;
