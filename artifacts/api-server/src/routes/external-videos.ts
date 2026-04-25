import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, packageExternalVideosTable, servicePackagesTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";
import "../lib/session";

const router: IRouter = Router();

router.get("/packages/:packageId/external-videos", async (req, res): Promise<void> => {
  const { packageId } = req.params;
  const videos = await db
    .select()
    .from(packageExternalVideosTable)
    .where(eq(packageExternalVideosTable.packageId, packageId))
    .orderBy(asc(packageExternalVideosTable.sortOrder), asc(packageExternalVideosTable.createdAt));
  res.json(videos);
});

router.post(
  "/packages/:packageId/external-videos",
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

    const existing = await db
      .select()
      .from(packageExternalVideosTable)
      .where(eq(packageExternalVideosTable.packageId, packageId));

    const { title, videoType, videoUrl, objectPath, description } = req.body as {
      title: string;
      videoType: string;
      videoUrl?: string;
      objectPath?: string;
      description?: string;
    };

    if (!title?.trim()) {
      res.status(400).json({ error: "동영상 제목을 입력해주세요" });
      return;
    }

    if (videoType === "url" && !videoUrl?.trim()) {
      res.status(400).json({ error: "동영상 URL을 입력해주세요" });
      return;
    }

    if (videoType === "upload" && !objectPath?.trim()) {
      res.status(400).json({ error: "업로드된 파일 경로가 없습니다" });
      return;
    }

    const [video] = await db
      .insert(packageExternalVideosTable)
      .values({
        packageId,
        title: title.trim(),
        videoType,
        videoUrl: videoUrl?.trim() ?? null,
        objectPath: objectPath?.trim() ?? null,
        description: description?.trim() ?? null,
        sortOrder: existing.length,
      })
      .returning();

    res.status(201).json(video);
  },
);

router.put(
  "/packages/:packageId/external-videos/:videoId",
  requireAdmin,
  async (req, res): Promise<void> => {
    const { packageId, videoId } = req.params;
    const id = parseInt(videoId, 10);

    const { title, description, sortOrder } = req.body as {
      title?: string;
      description?: string;
      sortOrder?: number;
    };

    const [updated] = await db
      .update(packageExternalVideosTable)
      .set({
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
        updatedAt: new Date(),
      })
      .where(
        eq(packageExternalVideosTable.id, id),
      )
      .returning();

    if (!updated || updated.packageId !== packageId) {
      res.status(404).json({ error: "동영상을 찾을 수 없습니다" });
      return;
    }

    res.json(updated);
  },
);

router.delete(
  "/packages/:packageId/external-videos/:videoId",
  requireAdmin,
  async (req, res): Promise<void> => {
    const { packageId, videoId } = req.params;
    const id = parseInt(videoId, 10);

    const [deleted] = await db
      .delete(packageExternalVideosTable)
      .where(eq(packageExternalVideosTable.id, id))
      .returning();

    if (!deleted || deleted.packageId !== packageId) {
      res.status(404).json({ error: "동영상을 찾을 수 없습니다" });
      return;
    }

    res.status(204).send();
  },
);

export default router;
