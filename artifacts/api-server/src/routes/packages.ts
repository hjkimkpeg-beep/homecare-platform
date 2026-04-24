import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import {
  db,
  servicePackagesTable,
  packageIncludedItemsTable,
  packageExcludedItemsTable,
  packageTasksTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/packages", async (_req, res): Promise<void> => {
  const packages = await db
    .select()
    .from(servicePackagesTable)
    .where(eq(servicePackagesTable.isActive, true))
    .orderBy(asc(servicePackagesTable.sortOrder));

  res.json(packages.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    basePrice: p.basePrice,
    estimatedMinutes: p.estimatedMinutes,
    asWarrantyDays: p.asWarrantyDays,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
  })));
});

router.get("/packages/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [pkg] = await db
    .select()
    .from(servicePackagesTable)
    .where(eq(servicePackagesTable.id, id));

  if (!pkg) {
    res.status(404).json({ error: "패키지를 찾을 수 없습니다" });
    return;
  }

  const [includedItems, excludedItems, tasks] = await Promise.all([
    db
      .select()
      .from(packageIncludedItemsTable)
      .where(eq(packageIncludedItemsTable.packageId, id))
      .orderBy(asc(packageIncludedItemsTable.sortOrder)),
    db
      .select()
      .from(packageExcludedItemsTable)
      .where(eq(packageExcludedItemsTable.packageId, id))
      .orderBy(asc(packageExcludedItemsTable.sortOrder)),
    db
      .select()
      .from(packageTasksTable)
      .where(eq(packageTasksTable.packageId, id))
      .orderBy(asc(packageTasksTable.sortOrder)),
  ]);

  res.json({
    id: pkg.id,
    name: pkg.name,
    slug: pkg.slug,
    description: pkg.description,
    basePrice: pkg.basePrice,
    estimatedMinutes: pkg.estimatedMinutes,
    asWarrantyDays: pkg.asWarrantyDays,
    isActive: pkg.isActive,
    sortOrder: pkg.sortOrder,
    includedItems: includedItems.map((i) => i.item),
    excludedItems: excludedItems.map((i) => i.item),
    tasks: tasks.map((t) => t.task),
  });
});

export default router;
