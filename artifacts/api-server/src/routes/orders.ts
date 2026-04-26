import { Router, type IRouter } from "express";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import {
  db,
  ordersTable,
  orderStatusLogsTable,
  servicePackagesTable,
  jobAssignmentsTable,
  partnerProfilesTable,
  usersTable,
  reviewsTable,
  customerProfilesTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { isOrderStatus, type OrderStatus } from "../lib/order-status";
import "../lib/session";

const router: IRouter = Router();

function generateOrderNumber(): string {
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `HC${yyyymmdd}${rand}`;
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const customerId = req.session.customerProfileId;
  if (!customerId) {
    res.status(403).json({ error: "고객 계정만 이용 가능합니다" });
    return;
  }

  const { status } = req.query;
  if (status !== undefined && !isOrderStatus(status)) {
    res.status(400).json({ error: "유효하지 않은 주문 상태입니다" });
    return;
  }

  let query = db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.customerId, customerId))
    .orderBy(desc(ordersTable.createdAt));

  const orders = await query;
  const filtered = status
    ? orders.filter((o) => o.status === status)
    : orders;

  res.json(filtered.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerId: o.customerId,
    packageId: o.packageId,
    packageName: o.packageName,
    status: o.status,
    totalPrice: o.totalPrice,
    roadAddress: o.roadAddress,
    detailAddress: o.detailAddress,
    scheduledDate: o.scheduledDate,
    requestNote: o.requestNote,
    paymentMethod: o.paymentMethod,
    refundBankName: o.refundBankName,
    refundAccountNumber: o.refundAccountNumber,
    refundAccountHolder: o.refundAccountHolder,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  })));
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const customerId = req.session.customerProfileId;
  if (!customerId) {
    res.status(403).json({ error: "고객 계정만 이용 가능합니다" });
    return;
  }

  const {
    packageId, roadAddress, detailAddress, scheduledDate, requestNote,
    paymentMethod, refundBankName, refundAccountNumber, refundAccountHolder,
  } = req.body;
  if (!packageId || !roadAddress || !detailAddress || !scheduledDate) {
    res.status(400).json({ error: "필수 항목을 입력해주세요" });
    return;
  }

  if (paymentMethod && !["cash", "card"].includes(paymentMethod)) {
    res.status(400).json({ error: "결제 수단이 올바르지 않습니다" });
    return;
  }

  if (paymentMethod === "cash" && (!refundBankName || !refundAccountNumber || !refundAccountHolder)) {
    res.status(400).json({ error: "현금 결제 시 환불 계좌 정보를 입력해주세요" });
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

  const orderNumber = generateOrderNumber();

  const [order] = await db
    .insert(ordersTable)
    .values({
      orderNumber,
      customerId,
      packageId,
      packageName: pkg.name,
      status: "pending_assignment",
      totalPrice: pkg.basePrice,
      roadAddress,
      detailAddress,
      scheduledDate: new Date(scheduledDate),
      requestNote: requestNote || null,
      paymentMethod: paymentMethod || null,
      refundBankName: paymentMethod === "cash" ? (refundBankName || null) : null,
      refundAccountNumber: paymentMethod === "cash" ? (refundAccountNumber || null) : null,
      refundAccountHolder: paymentMethod === "cash" ? (refundAccountHolder || null) : null,
    })
    .returning();

  await db.insert(orderStatusLogsTable).values({
    orderId: order.id,
    status: "pending_assignment",
    note: `예약이 접수되었습니다 (${paymentMethod === "card" ? "카드 결제" : paymentMethod === "cash" ? "현금 결제" : "결제 미선택"})`,
    createdBy: req.session.userId,
  });

  res.status(201).json({
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    packageId: order.packageId,
    packageName: order.packageName,
    status: order.status,
    totalPrice: order.totalPrice,
    roadAddress: order.roadAddress,
    detailAddress: order.detailAddress,
    scheduledDate: order.scheduledDate,
    requestNote: order.requestNote,
    paymentMethod: order.paymentMethod,
    refundBankName: order.refundBankName,
    refundAccountNumber: order.refundAccountNumber,
    refundAccountHolder: order.refundAccountHolder,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  });
});

// ─── Public: lookup by phone + orderNumber ───────────────────────────────────
router.get("/orders/lookup", async (req, res): Promise<void> => {
  const phone = (req.query.phone as string | undefined)?.trim();
  const orderNumber = (req.query.orderNumber as string | undefined)?.trim();

  if (!phone || !orderNumber) {
    res.status(400).json({ error: "전화번호와 예약번호를 모두 입력해주세요" });
    return;
  }

  // find customer by phone
  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (!user) { res.status(404).json({ error: "예약 정보를 찾을 수 없습니다" }); return; }

  const [customer] = await db.select().from(customerProfilesTable).where(eq(customerProfilesTable.userId, user.id));
  if (!customer) { res.status(404).json({ error: "예약 정보를 찾을 수 없습니다" }); return; }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.customerId, customer.id),
        eq(ordersTable.orderNumber, orderNumber)
      )
    );

  if (!order) { res.status(404).json({ error: "예약 정보를 찾을 수 없습니다" }); return; }

  res.json({
    id: order.id,
    orderNumber: order.orderNumber,
    packageName: order.packageName,
    status: order.status,
    totalPrice: order.totalPrice,
    roadAddress: order.roadAddress,
    detailAddress: order.detailAddress,
    scheduledDate: order.scheduledDate,
    requestNote: order.requestNote,
    createdAt: order.createdAt,
  });
});

// ─── Public: modify booking (with phone+orderNumber verification) ─────────────
router.patch("/orders/:id/modify", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { phone, orderNumber, scheduledDate, roadAddress, detailAddress, requestNote } = req.body;

  if (!phone || !orderNumber) {
    res.status(400).json({ error: "전화번호와 예약번호로 본인 확인이 필요합니다" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, (phone as string).trim()));
  if (!user) { res.status(403).json({ error: "본인 확인에 실패했습니다" }); return; }

  const [customer] = await db.select().from(customerProfilesTable).where(eq(customerProfilesTable.userId, user.id));
  if (!customer) { res.status(403).json({ error: "본인 확인에 실패했습니다" }); return; }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "예약을 찾을 수 없습니다" }); return; }

  if (order.customerId !== customer.id || order.orderNumber !== (orderNumber as string).trim()) {
    res.status(403).json({ error: "본인 확인에 실패했습니다" });
    return;
  }

  const modifiableStatuses: OrderStatus[] = ["pending_assignment", "assigned"];
  if (!modifiableStatuses.includes(order.status)) {
    res.status(400).json({ error: "현재 상태에서는 예약을 수정할 수 없습니다" });
    return;
  }

  const updateData: Partial<typeof order> = {};
  if (scheduledDate)  updateData.scheduledDate = new Date(scheduledDate);
  if (roadAddress)    updateData.roadAddress = roadAddress;
  if (detailAddress !== undefined) updateData.detailAddress = detailAddress;
  if (requestNote !== undefined)  updateData.requestNote = requestNote;

  const [updated] = await db
    .update(ordersTable)
    .set(updateData)
    .where(eq(ordersTable.id, id))
    .returning();

  res.json({
    id: updated.id,
    orderNumber: updated.orderNumber,
    packageName: updated.packageName,
    status: updated.status,
    totalPrice: updated.totalPrice,
    roadAddress: updated.roadAddress,
    detailAddress: updated.detailAddress,
    scheduledDate: updated.scheduledDate,
    requestNote: updated.requestNote,
    createdAt: updated.createdAt,
  });
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const customerId = req.session.customerProfileId;

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id));

  if (!order) {
    res.status(404).json({ error: "주문을 찾을 수 없습니다" });
    return;
  }

  if (customerId && order.customerId !== customerId) {
    res.status(403).json({ error: "권한이 없습니다" });
    return;
  }

  const [statusLogs, assignments, reviewData] = await Promise.all([
    db
      .select()
      .from(orderStatusLogsTable)
      .where(eq(orderStatusLogsTable.orderId, id))
      .orderBy(orderStatusLogsTable.createdAt),
    db
      .select({
        assignment: jobAssignmentsTable,
        partnerUser: usersTable,
      })
      .from(jobAssignmentsTable)
      .leftJoin(partnerProfilesTable, eq(jobAssignmentsTable.partnerId, partnerProfilesTable.id))
      .leftJoin(usersTable, eq(partnerProfilesTable.userId, usersTable.id))
      .where(eq(jobAssignmentsTable.orderId, id))
      .orderBy(desc(jobAssignmentsTable.createdAt))
      .limit(1),
    db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.orderId, id))
      .limit(1),
  ]);

  const activeAssignment = assignments[0];
  const review = reviewData[0];

  res.json({
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    packageId: order.packageId,
    packageName: order.packageName,
    status: order.status,
    totalPrice: order.totalPrice,
    roadAddress: order.roadAddress,
    detailAddress: order.detailAddress,
    scheduledDate: order.scheduledDate,
    requestNote: order.requestNote,
    paymentMethod: order.paymentMethod,
    refundBankName: order.refundBankName,
    refundAccountNumber: order.refundAccountNumber,
    refundAccountHolder: order.refundAccountHolder,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    statusLogs: statusLogs.map((l) => ({
      id: l.id,
      orderId: l.orderId,
      status: l.status,
      note: l.note,
      createdAt: l.createdAt,
    })),
    assignment: activeAssignment
      ? {
          id: activeAssignment.assignment.id,
          orderId: activeAssignment.assignment.orderId,
          partnerId: activeAssignment.assignment.partnerId,
          partnerName: activeAssignment.partnerUser?.name || "파트너",
          partnerPhone: activeAssignment.partnerUser?.phone || "",
          status: activeAssignment.assignment.status,
          scheduledDate: activeAssignment.assignment.scheduledDate,
          createdAt: activeAssignment.assignment.createdAt,
        }
      : null,
    review: review
      ? {
          id: review.id,
          orderId: review.orderId,
          customerId: review.customerId,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        }
      : null,
  });
});

router.post("/orders/:id/cancel", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const customerId = req.session.customerProfileId;

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id));

  if (!order) {
    res.status(404).json({ error: "주문을 찾을 수 없습니다" });
    return;
  }

  if (customerId && order.customerId !== customerId) {
    res.status(403).json({ error: "권한이 없습니다" });
    return;
  }

  const cancelableStatuses: OrderStatus[] = ["pending_assignment", "paid", "requested"];
  if (!cancelableStatuses.includes(order.status)) {
    res.status(400).json({ error: "현재 상태에서는 취소할 수 없습니다" });
    return;
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: "cancelled" })
    .where(eq(ordersTable.id, id))
    .returning();

  await db.insert(orderStatusLogsTable).values({
    orderId: id,
    status: "cancelled",
    note: "고객 취소",
    createdBy: req.session.userId,
  });

  res.json({
    id: updated.id,
    orderNumber: updated.orderNumber,
    customerId: updated.customerId,
    packageId: updated.packageId,
    packageName: updated.packageName,
    status: updated.status,
    totalPrice: updated.totalPrice,
    roadAddress: updated.roadAddress,
    detailAddress: updated.detailAddress,
    scheduledDate: updated.scheduledDate,
    requestNote: updated.requestNote,
    paymentMethod: updated.paymentMethod,
    refundBankName: updated.refundBankName,
    refundAccountNumber: updated.refundAccountNumber,
    refundAccountHolder: updated.refundAccountHolder,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
});

export default router;
