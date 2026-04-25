import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, packageStandardManualsTable, servicePackagesTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";
import "../lib/session";

const router: IRouter = Router();

router.get("/packages/:packageId/standard-manual", async (req, res): Promise<void> => {
  const { packageId } = req.params;

  const [manual] = await db
    .select()
    .from(packageStandardManualsTable)
    .where(eq(packageStandardManualsTable.packageId, packageId));

  if (!manual) {
    res.status(404).json({ error: "표준 매뉴얼이 없습니다" });
    return;
  }

  res.json(manual);
});

router.post(
  "/packages/:packageId/standard-manual",
  requireAdmin,
  async (req, res): Promise<void> => {
    const { packageId } = req.params;

    const [pkg] = await db
      .select()
      .from(servicePackagesTable)
      .where(eq(servicePackagesTable.id, packageId));

    if (!pkg) {
      res.status(404).json({ error: "패키지를 찾을 수 없습니다" });
      return;
    }

    const { title, fileType, objectPath, originalName, fileSize } = req.body as {
      title: string;
      fileType: string;
      objectPath: string;
      originalName: string;
      fileSize?: number;
    };

    if (!title?.trim() || !objectPath?.trim() || !fileType?.trim()) {
      res.status(400).json({ error: "필수 항목이 누락되었습니다" });
      return;
    }

    await db
      .delete(packageStandardManualsTable)
      .where(eq(packageStandardManualsTable.packageId, packageId));

    const [manual] = await db
      .insert(packageStandardManualsTable)
      .values({
        packageId,
        title: title.trim(),
        fileType,
        objectPath: objectPath.trim(),
        originalName,
        fileSize: fileSize ?? null,
      })
      .returning();

    res.status(201).json(manual);
  },
);

router.delete(
  "/packages/:packageId/standard-manual",
  requireAdmin,
  async (req, res): Promise<void> => {
    const { packageId } = req.params;

    await db
      .delete(packageStandardManualsTable)
      .where(eq(packageStandardManualsTable.packageId, packageId));

    res.status(204).send();
  },
);

export default router;
