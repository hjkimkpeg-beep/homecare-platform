import { Router, type IRouter } from "express";
import { eq, and, asc } from "drizzle-orm";
import { db, serviceManualsTable, servicePackagesTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";
import "../lib/session";

const router: IRouter = Router();

function getParam(req: any, key: string): string {
  const value = req.params?.[key];
  return Array.isArray(value) ? value[0] : String(value);
}

router.get("/packages/:packageId/manuals", async (req, res): Promise<void> => {
  const packageId = getParam(req, "packageId");
  const manuals = await db
    .select()
    .from(serviceManualsTable)
    .where(eq(serviceManualsTable.packageId, packageId))
    .orderBy(asc(serviceManualsTable.sortOrder), asc(serviceManualsTable.createdAt));
  res.json(manuals);
});

router.post("/packages/:packageId/manuals", requireAdmin, async (req, res): Promise<void> => {
  const packageId = getParam(req, "packageId");
  const { title, description, fileType, objectPath, originalName, fileSize, sortOrder } =
    req.body as {
      title: string;
      description?: string;
      fileType: string;
      objectPath: string;
      originalName: string;
      fileSize?: number;
      sortOrder?: number;
    };

  if (!title || !fileType || !objectPath || !originalName) {
    res.status(400).json({ error: "title, fileType, objectPath, originalName은 필수입니다" });
    return;
  }

  const [pkg] = await db
    .select()
    .from(servicePackagesTable)
    .where(eq(servicePackagesTable.id, packageId));

  if (!pkg) {
    res.status(404).json({ error: "패키지를 찾을 수 없습니다" });
    return;
  }

  const [manual] = await db
    .insert(serviceManualsTable)
    .values({
      packageId,
      title,
      description: description ?? null,
      fileType,
      objectPath,
      originalName,
      fileSize: fileSize ?? null,
      sortOrder: sortOrder ?? 0,
    })
    .returning();

  res.status(201).json(manual);
});

router.delete(
  "/packages/:packageId/manuals/:manualId",
  requireAdmin,
  async (req, res): Promise<void> => {
    const packageId = getParam(req, "packageId");
    const manualId = parseInt(getParam(req, "manualId"), 10);
    if (isNaN(manualId)) {
      res.status(400).json({ error: "잘못된 manualId입니다" });
      return;
    }

    await db
      .delete(serviceManualsTable)
      .where(
        and(
          eq(serviceManualsTable.id, manualId),
          eq(serviceManualsTable.packageId, packageId),
        ),
      );

    res.status(204).end();
  },
);

export default router;
