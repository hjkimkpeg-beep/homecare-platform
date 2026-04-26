import { Router, type IRouter } from "express";
import { eq, desc, and, inArray } from "drizzle-orm";
import {
  db,
  ordersTable,
  orderStatusLogsTable,
  jobAssignmentsTable,
} from "@workspace/db";
import { requirePartner } from "../middlewares/auth";
import { type OrderStatus } from "../lib/order-status";
import "../lib/session";

const router: IRouter = Router();

const listPartnerOrders = async (req: any, res: any): Promise<void> => {
  const partnerId = req.session.partnerProfileId!;

  const assignments = await db
    .select()
    .from(jobAssignmentsTable)
    .where(
      and(
        eq(jobAssignmentsTable.partnerId, partnerId),
        inArray(jobAssignmentsTable.status, ["pending", "accepted"]),
      ),
    )
    .orderBy(desc(jobAssignmentsTable.createdAt));

  if (assignments.length === 0) {
    res.json([]);
    return;
  }

  const orderIds = assignments.map((a) => a.orderId);
  const orders = await db
    .select()
    .from(ordersTable)
    .where(inArray(ordersTable.id, orderIds));

  const orderMap = new Map(orders.map((o) => [o.id, o]));

  const result = assignments.map((a) => {
    const order = orderMap.get(a.orderId);
    return {
      assignmentId: a.id,
      assignmentStatus: a.status,
      orderId: a.orderId,
      orderNumber: order?.orderNumber,
      packageName: order?.packageName,
      orderStatus: order?.status,
      totalPrice: order?.totalPrice,
      roadAddress: order?.roadAddress,
      detailAddress: order?.detailAddress,
      scheduledDate: order?.scheduledDate,
      requestNote: order?.requestNote,
      createdAt: a.createdAt,
    };
  });

  res.json(result);
};

const getPartnerOrderDetail = async (req: any, res: any): Promise<void> => {
  const partnerId = req.session.partnerProfileId!;
  const { orderId } = req.params;

  const [assignment] = await db
    .select()
    .from(jobAssignmentsTable)
    .where(
      and(
        eq(jobAssignmentsTable.partnerId, partnerId),
        eq(jobAssignmentsTable.orderId, orderId),
      ),
    )
    .limit(1);

  if (!assignment) {
    res.status(404).json({ error: "배차 정보를 찾을 수 없습니다" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId))
    .limit(1);

  if (!order) {
    res.status(404).json({ error: "주문을 찾을 수 없습니다" });
    return;
  }

  const statusLogs = await db
    .select()
    .from(orderStatusLogsTable)
    .where(eq(orderStatusLogsTable.orderId, orderId))
    .orderBy(desc(orderStatusLogsTable.createdAt));

  res.json({
    assignmentId: assignment.id,
    assignmentStatus: assignment.status,
    orderId: order.id,
    orderNumber: order.orderNumber,
    packageName: order.packageName,
    orderStatus: order.status,
    totalPrice: order.totalPrice,
    roadAddress: order.roadAddress,
    detailAddress: order.detailAddress,
    scheduledDate: order.scheduledDate,
    requestNote: order.requestNote,
    createdAt: order.createdAt,
    statusLogs: statusLogs.map((l) => ({
      status: l.status,
      note: l.note,
      createdAt: l.createdAt,
    })),
  });
};

const acceptPartnerOrder = async (req: any, res: any): Promise<void> => {
  const partnerId = req.session.partnerProfileId!;
  const { orderId } = req.params;

  const [assignment] = await db
    .select()
    .from(jobAssignmentsTable)
    .where(
      and(
        eq(jobAssignmentsTable.partnerId, partnerId),
        eq(jobAssignmentsTable.orderId, orderId),
        eq(jobAssignmentsTable.status, "pending"),
      ),
    )
    .limit(1);

  if (!assignment) {
    res.status(404).json({ error: "수락 가능한 배차를 찾을 수 없습니다" });
    return;
  }

  await db
    .update(jobAssignmentsTable)
    .set({ status: "accepted" })
    .where(eq(jobAssignmentsTable.id, assignment.id));

  await db
    .update(ordersTable)
    .set({ status: "assigned" })
    .where(eq(ordersTable.id, orderId));

  await db.insert(orderStatusLogsTable).values({
    orderId,
    status: "assigned",
    note: "파트너가 배차를 수락했습니다",
    createdBy: req.session.userId,
  });

  res.json({ success: true });
};

const rejectPartnerOrder = async (req: any, res: any): Promise<void> => {
  const partnerId = req.session.partnerProfileId!;
  const { orderId } = req.params;
  const { reason } = req.body as { reason?: string };

  const [assignment] = await db
    .select()
    .from(jobAssignmentsTable)
    .where(
      and(
        eq(jobAssignmentsTable.partnerId, partnerId),
        eq(jobAssignmentsTable.orderId, orderId),
        eq(jobAssignmentsTable.status, "pending"),
      ),
    )
    .limit(1);

  if (!assignment) {
    res.status(404).json({ error: "거절 가능한 배차를 찾을 수 없습니다" });
    return;
  }

  await db
    .update(jobAssignmentsTable)
    .set({ status: "rejected" })
    .where(eq(jobAssignmentsTable.id, assignment.id));

  await db
    .update(ordersTable)
    .set({ status: "pending_assignment" })
    .where(eq(ordersTable.id, orderId));

  await db.insert(orderStatusLogsTable).values({
    orderId,
    status: "pending_assignment",
    note: reason ? `파트너 거절: ${reason}` : "파트너가 배차를 거절했습니다",
    createdBy: req.session.userId,
  });

  res.json({ success: true });
};

const PARTNER_STATUS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  assigned: "en_route",
  en_route: "arrived",
  arrived: "in_progress",
  in_progress: "inspection_pending",
};

const STATUS_NOTES: Partial<Record<OrderStatus, string>> = {
  en_route: "파트너가 이동 중입니다",
  arrived: "파트너가 현장에 도착했습니다",
  in_progress: "작업이 시작되었습니다",
  inspection_pending: "작업 완료, 검수 대기 중입니다",
};

const updatePartnerOrderStatus = async (req: any, res: any): Promise<void> => {
  const partnerId = req.session.partnerProfileId!;
  const { orderId } = req.params;

  const [assignment] = await db
    .select()
    .from(jobAssignmentsTable)
    .where(
      and(
        eq(jobAssignmentsTable.partnerId, partnerId),
        eq(jobAssignmentsTable.orderId, orderId),
        eq(jobAssignmentsTable.status, "accepted"),
      ),
    )
    .limit(1);

  if (!assignment) {
    res.status(403).json({ error: "이 주문에 대한 권한이 없습니다" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId))
    .limit(1);

  if (!order) {
    res.status(404).json({ error: "주문을 찾을 수 없습니다" });
    return;
  }

  const nextStatus = PARTNER_STATUS_TRANSITIONS[order.status];
  if (!nextStatus) {
    res.status(400).json({ error: "현재 상태에서 변경 가능한 다음 단계가 없습니다" });
    return;
  }

  await db
    .update(ordersTable)
    .set({ status: nextStatus })
    .where(eq(ordersTable.id, orderId));

  await db.insert(orderStatusLogsTable).values({
    orderId,
    status: nextStatus,
    note: STATUS_NOTES[nextStatus],
    createdBy: req.session.userId,
  });

  res.json({ success: true, status: nextStatus });
};

// Canonical routes
router.get("/partner/orders", requirePartner, listPartnerOrders);
router.get("/partner/orders/:orderId", requirePartner, getPartnerOrderDetail);
router.post("/partner/orders/:orderId/accept", requirePartner, acceptPartnerOrder);
router.post("/partner/orders/:orderId/reject", requirePartner, rejectPartnerOrder);
router.post("/partner/orders/:orderId/status", requirePartner, updatePartnerOrderStatus);

// Backward-compatible aliases for legacy frontend calls
router.get("/partner/jobs", requirePartner, listPartnerOrders);
router.get("/partner/jobs/:orderId", requirePartner, getPartnerOrderDetail);
router.post("/partner/jobs/:orderId/accept", requirePartner, acceptPartnerOrder);
router.post("/partner/jobs/:orderId/reject", requirePartner, rejectPartnerOrder);

router.get("/partner/history", requirePartner, async (req, res): Promise<void> => {
  const partnerId = req.session.partnerProfileId!;

  const assignments = await db
    .select()
    .from(jobAssignmentsTable)
    .where(
      and(
        eq(jobAssignmentsTable.partnerId, partnerId),
        inArray(jobAssignmentsTable.status, ["completed", "rejected", "cancelled"]),
      ),
    )
    .orderBy(desc(jobAssignmentsTable.createdAt))
    .limit(50);

  if (assignments.length === 0) {
    res.json([]);
    return;
  }

  const orderIds = assignments.map((a) => a.orderId);
  const orders = await db
    .select()
    .from(ordersTable)
    .where(inArray(ordersTable.id, orderIds));

  const orderMap = new Map(orders.map((o) => [o.id, o]));

  const result = assignments.map((a) => {
    const order = orderMap.get(a.orderId);
    return {
      assignmentId: a.id,
      assignmentStatus: a.status,
      orderId: a.orderId,
      orderNumber: order?.orderNumber,
      packageName: order?.packageName,
      orderStatus: order?.status,
      totalPrice: order?.totalPrice,
      roadAddress: order?.roadAddress,
      scheduledDate: order?.scheduledDate,
      createdAt: a.createdAt,
    };
  });

  res.json(result);
});

export default router;
