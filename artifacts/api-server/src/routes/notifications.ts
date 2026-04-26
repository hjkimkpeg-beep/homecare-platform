import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, smsNotificationsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";
import "../lib/session";

const router: IRouter = Router();

router.get("/admin/notifications", requireAdmin, async (req, res): Promise<void> => {
  const { isSent, type } = req.query as Record<string, string>;

  let query = db
    .select()
    .from(smsNotificationsTable)
    .orderBy(desc(smsNotificationsTable.createdAt))
    .$dynamic();

  const conditions = [];
  if (isSent !== undefined) conditions.push(eq(smsNotificationsTable.isSent, isSent === "true"));
  if (type) conditions.push(eq(smsNotificationsTable.type, type as any));

  const notifications = await db
    .select()
    .from(smsNotificationsTable)
    .orderBy(desc(smsNotificationsTable.createdAt));

  const filtered = notifications.filter((n) => {
    if (isSent !== undefined && n.isSent !== (isSent === "true")) return false;
    if (type && n.type !== type) return false;
    return true;
  });

  res.json(filtered);
});

router.patch("/admin/notifications/:id/send", requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;

  const [updated] = await db
    .update(smsNotificationsTable)
    .set({ isSent: true, sentAt: new Date() })
    .where(eq(smsNotificationsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "알림을 찾을 수 없습니다" });
    return;
  }

  res.json(updated);
});

export default router;
