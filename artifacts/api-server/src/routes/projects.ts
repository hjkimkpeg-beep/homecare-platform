import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import {
  db,
  serviceProjectsTable,
  partnerProfilesTable,
  usersTable,
  servicePackagesTable,
} from "@workspace/db";
import { requireAdmin, requireAuth } from "../middlewares/auth";
import "../lib/session";

const router: IRouter = Router();

router.get("/admin/projects", requireAdmin, async (req, res): Promise<void> => {
  const { status, partnerId } = req.query as Record<string, string>;

  const conditions = [];
  if (status) conditions.push(eq(serviceProjectsTable.status, status as any));
  if (partnerId) conditions.push(eq(serviceProjectsTable.partnerId, partnerId));

  const projects = await db
    .select({
      id: serviceProjectsTable.id,
      title: serviceProjectsTable.title,
      orderId: serviceProjectsTable.orderId,
      packageId: serviceProjectsTable.packageId,
      applicantName: serviceProjectsTable.applicantName,
      applicantPhone: serviceProjectsTable.applicantPhone,
      applicantAddress: serviceProjectsTable.applicantAddress,
      serviceContent: serviceProjectsTable.serviceContent,
      partnerId: serviceProjectsTable.partnerId,
      partnerName: usersTable.name,
      notes: serviceProjectsTable.notes,
      status: serviceProjectsTable.status,
      startDate: serviceProjectsTable.startDate,
      endDate: serviceProjectsTable.endDate,
      createdBy: serviceProjectsTable.createdBy,
      createdAt: serviceProjectsTable.createdAt,
      updatedAt: serviceProjectsTable.updatedAt,
    })
    .from(serviceProjectsTable)
    .leftJoin(partnerProfilesTable, eq(serviceProjectsTable.partnerId, partnerProfilesTable.id))
    .leftJoin(usersTable, eq(partnerProfilesTable.userId, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(serviceProjectsTable.createdAt));

  res.json(projects);
});

router.post("/admin/projects", requireAdmin, async (req, res): Promise<void> => {
  const userId = req.session.userId;
  const { title, orderId, packageId, applicantName, applicantPhone, applicantAddress,
    serviceContent, partnerId, notes, status, startDate, endDate } = req.body;

  if (!title?.trim() || !applicantName?.trim() || !applicantPhone?.trim()) {
    res.status(400).json({ error: "필수 항목(제목, 신청자명, 연락처)이 누락되었습니다" });
    return;
  }

  const [project] = await db
    .insert(serviceProjectsTable)
    .values({
      title: title.trim(),
      orderId: orderId || null,
      packageId: packageId || null,
      applicantName: applicantName.trim(),
      applicantPhone: applicantPhone.trim(),
      applicantAddress: applicantAddress?.trim() || null,
      serviceContent: serviceContent?.trim() || null,
      partnerId: partnerId || null,
      notes: notes?.trim() || null,
      status: status || "planning",
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      createdBy: userId,
    })
    .returning();

  res.status(201).json(project);
});

router.get("/admin/projects/:projectId", requireAdmin, async (req, res): Promise<void> => {
  const { projectId } = req.params;

  const [project] = await db
    .select({
      id: serviceProjectsTable.id,
      title: serviceProjectsTable.title,
      orderId: serviceProjectsTable.orderId,
      packageId: serviceProjectsTable.packageId,
      applicantName: serviceProjectsTable.applicantName,
      applicantPhone: serviceProjectsTable.applicantPhone,
      applicantAddress: serviceProjectsTable.applicantAddress,
      serviceContent: serviceProjectsTable.serviceContent,
      partnerId: serviceProjectsTable.partnerId,
      partnerName: usersTable.name,
      notes: serviceProjectsTable.notes,
      status: serviceProjectsTable.status,
      startDate: serviceProjectsTable.startDate,
      endDate: serviceProjectsTable.endDate,
      createdBy: serviceProjectsTable.createdBy,
      createdAt: serviceProjectsTable.createdAt,
      updatedAt: serviceProjectsTable.updatedAt,
    })
    .from(serviceProjectsTable)
    .leftJoin(partnerProfilesTable, eq(serviceProjectsTable.partnerId, partnerProfilesTable.id))
    .leftJoin(usersTable, eq(partnerProfilesTable.userId, usersTable.id))
    .where(eq(serviceProjectsTable.id, projectId));

  if (!project) {
    res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
    return;
  }

  res.json(project);
});

router.patch("/admin/projects/:projectId", requireAdmin, async (req, res): Promise<void> => {
  const { projectId } = req.params;
  const { title, orderId, packageId, applicantName, applicantPhone, applicantAddress,
    serviceContent, partnerId, notes, status, startDate, endDate } = req.body;

  const [existing] = await db
    .select({ id: serviceProjectsTable.id })
    .from(serviceProjectsTable)
    .where(eq(serviceProjectsTable.id, projectId));

  if (!existing) {
    res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
    return;
  }

  const updates: Record<string, any> = {};
  if (title !== undefined) updates.title = title.trim();
  if (orderId !== undefined) updates.orderId = orderId || null;
  if (packageId !== undefined) updates.packageId = packageId || null;
  if (applicantName !== undefined) updates.applicantName = applicantName.trim();
  if (applicantPhone !== undefined) updates.applicantPhone = applicantPhone.trim();
  if (applicantAddress !== undefined) updates.applicantAddress = applicantAddress?.trim() || null;
  if (serviceContent !== undefined) updates.serviceContent = serviceContent?.trim() || null;
  if (partnerId !== undefined) updates.partnerId = partnerId || null;
  if (notes !== undefined) updates.notes = notes?.trim() || null;
  if (status !== undefined) updates.status = status;
  if (startDate !== undefined) updates.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;

  const [updated] = await db
    .update(serviceProjectsTable)
    .set(updates)
    .where(eq(serviceProjectsTable.id, projectId))
    .returning();

  res.json(updated);
});

router.delete("/admin/projects/:projectId", requireAdmin, async (req, res): Promise<void> => {
  const { projectId } = req.params;

  await db.delete(serviceProjectsTable).where(eq(serviceProjectsTable.id, projectId));
  res.json({ ok: true });
});

export default router;
