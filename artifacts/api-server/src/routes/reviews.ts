import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, reviewsTable, asRequestsTable, ordersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import "../lib/session";

const router: IRouter = Router();

router.post("/reviews", requireAuth, async (req, res): Promise<void> => {
  const { orderId, rating, comment } = req.body;
  const customerId = req.session.customerProfileId;

  if (!orderId || !rating) {
    res.status(400).json({ error: "필수 항목을 입력해주세요" });
    return;
  }

  if (!customerId) {
    res.status(403).json({ error: "고객 계정만 이용 가능합니다" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId));

  if (!order || order.customerId !== customerId) {
    res.status(404).json({ error: "주문을 찾을 수 없습니다" });
    return;
  }

  if (order.status !== "completed") {
    res.status(400).json({ error: "완료된 주문에만 후기를 작성할 수 있습니다" });
    return;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({
      orderId,
      customerId,
      rating,
      comment: comment || null,
    })
    .returning();

  res.status(201).json({
    id: review.id,
    orderId: review.orderId,
    customerId: review.customerId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  });
});

router.post("/as-requests", requireAuth, async (req, res): Promise<void> => {
  const { orderId, reason, description } = req.body;
  const customerId = req.session.customerProfileId;

  if (!orderId || !reason) {
    res.status(400).json({ error: "필수 항목을 입력해주세요" });
    return;
  }

  if (!customerId) {
    res.status(403).json({ error: "고객 계정만 이용 가능합니다" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId));

  if (!order || order.customerId !== customerId) {
    res.status(404).json({ error: "주문을 찾을 수 없습니다" });
    return;
  }

  const [request] = await db
    .insert(asRequestsTable)
    .values({
      orderId,
      customerId,
      reason,
      description: description || null,
      status: "pending",
    })
    .returning();

  res.status(201).json({
    id: request.id,
    orderId: request.orderId,
    customerId: request.customerId,
    reason: request.reason,
    description: request.description,
    status: request.status,
    createdAt: request.createdAt,
  });
});

router.get("/as-requests", requireAuth, async (req, res): Promise<void> => {
  const customerId = req.session.customerProfileId;

  if (!customerId) {
    res.status(403).json({ error: "고객 계정만 이용 가능합니다" });
    return;
  }

  const requests = await db
    .select()
    .from(asRequestsTable)
    .where(eq(asRequestsTable.customerId, customerId))
    .orderBy(desc(asRequestsTable.createdAt));

  res.json(
    requests.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      customerId: r.customerId,
      reason: r.reason,
      description: r.description,
      status: r.status,
      createdAt: r.createdAt,
    })),
  );
});

export default router;
