import { Router, type IRouter } from "express";
import { eq, desc, count, and, sql, gte, lte, like, ilike } from "drizzle-orm";
import {
  db,
  ordersTable,
  orderStatusLogsTable,
  jobAssignmentsTable,
  partnerProfilesTable,
  customerProfilesTable,
  usersTable,
  asRequestsTable,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";
import "../lib/session";

const router: IRouter = Router();

router.get("/admin/dashboard", requireAdmin, async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalOrdersResult,
    pendingAssignmentResult,
    inProgressResult,
    inspectionPendingResult,
    completedTodayResult,
    asRequestsResult,
    statusCountsResult,
    recentOrders,
  ] = await Promise.all([
    db.select({ count: count() }).from(ordersTable),
    db.select({ count: count() }).from(ordersTable).where(eq(ordersTable.status, "pending_assignment")),
    db.select({ count: count() }).from(ordersTable).where(eq(ordersTable.status, "in_progress")),
    db.select({ count: count() }).from(ordersTable).where(eq(ordersTable.status, "inspection_pending")),
    db
      .select({ count: count() })
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.status, "completed"),
          sql`${ordersTable.updatedAt} >= ${today} AND ${ordersTable.updatedAt} < ${tomorrow}`,
        ),
      ),
    db.select({ count: count() }).from(asRequestsTable).where(eq(asRequestsTable.status, "pending")),
    db
      .select({ status: ordersTable.status, count: count() })
      .from(ordersTable)
      .groupBy(ordersTable.status),
    db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt))
      .limit(10),
  ]);

  res.json({
    totalOrders: totalOrdersResult[0]?.count ?? 0,
    pendingAssignment: pendingAssignmentResult[0]?.count ?? 0,
    inProgress: inProgressResult[0]?.count ?? 0,
    inspectionPending: inspectionPendingResult[0]?.count ?? 0,
    completedToday: completedTodayResult[0]?.count ?? 0,
    asRequests: asRequestsResult[0]?.count ?? 0,
    ordersByStatus: statusCountsResult.map((r) => ({
      status: r.status,
      count: Number(r.count),
    })),
    recentOrders: recentOrders.map((o) => ({
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
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    })),
  });
});

router.get("/admin/orders", requireAdmin, async (req, res): Promise<void> => {
  const { status, page = "1", limit = "20" } = req.query;
  const pageNum = parseInt(String(page), 10);
  const limitNum = parseInt(String(limit), 10);
  const offset = (pageNum - 1) * limitNum;

  const allOrders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt));

  const filtered = status ? allOrders.filter((o) => o.status === status) : allOrders;
  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limitNum);

  res.json({
    orders: paginated.map((o) => ({
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
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    })),
    total,
    page: pageNum,
    limit: limitNum,
  });
});

router.get("/admin/orders/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id));

  if (!order) {
    res.status(404).json({ error: "주문을 찾을 수 없습니다" });
    return;
  }

  const [statusLogs, customerData, assignmentData] = await Promise.all([
    db
      .select()
      .from(orderStatusLogsTable)
      .where(eq(orderStatusLogsTable.orderId, id))
      .orderBy(orderStatusLogsTable.createdAt),
    db
      .select({ profile: customerProfilesTable, user: usersTable })
      .from(customerProfilesTable)
      .leftJoin(usersTable, eq(customerProfilesTable.userId, usersTable.id))
      .where(eq(customerProfilesTable.id, order.customerId)),
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
  ]);

  const customer = customerData[0];
  const activeAssignment = assignmentData[0];

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
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customerName: customer?.user?.name || "알 수 없음",
    customerPhone: customer?.user?.phone || "",
    partnerName: activeAssignment?.partnerUser?.name || null,
    partnerPhone: activeAssignment?.partnerUser?.phone || null,
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
    review: null,
  });
});

router.patch("/admin/orders/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { status, note } = req.body;

  if (!status) {
    res.status(400).json({ error: "상태를 입력해주세요" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id));

  if (!order) {
    res.status(404).json({ error: "주문을 찾을 수 없습니다" });
    return;
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status })
    .where(eq(ordersTable.id, id))
    .returning();

  await db.insert(orderStatusLogsTable).values({
    orderId: id,
    status,
    note: note || null,
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
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
});

router.post("/admin/orders/:id/assign", requireAdmin, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { partnerId } = req.body;

  if (!partnerId) {
    res.status(400).json({ error: "파트너 ID를 입력해주세요" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id));

  if (!order) {
    res.status(404).json({ error: "주문을 찾을 수 없습니다" });
    return;
  }

  const [partner] = await db
    .select({ profile: partnerProfilesTable, user: usersTable })
    .from(partnerProfilesTable)
    .leftJoin(usersTable, eq(partnerProfilesTable.userId, usersTable.id))
    .where(eq(partnerProfilesTable.id, partnerId));

  if (!partner) {
    res.status(404).json({ error: "파트너를 찾을 수 없습니다" });
    return;
  }

  const [assignment] = await db
    .insert(jobAssignmentsTable)
    .values({
      orderId: id,
      partnerId,
      status: "pending",
      scheduledDate: order.scheduledDate,
    })
    .returning();

  await db
    .update(ordersTable)
    .set({ status: "assigned" })
    .where(eq(ordersTable.id, id));

  await db.insert(orderStatusLogsTable).values({
    orderId: id,
    status: "assigned",
    note: `파트너 배정: ${partner.user?.name || "파트너"}`,
    createdBy: req.session.userId,
  });

  res.json({
    id: assignment.id,
    orderId: assignment.orderId,
    partnerId: assignment.partnerId,
    partnerName: partner.user?.name || "파트너",
    partnerPhone: partner.user?.phone || "",
    status: assignment.status,
    scheduledDate: assignment.scheduledDate,
    createdAt: assignment.createdAt,
  });
});

router.get("/admin/assignments", requireAdmin, async (req, res): Promise<void> => {
  const { status } = req.query;

  const assignments = await db
    .select({
      assignment: jobAssignmentsTable,
      partnerUser: usersTable,
    })
    .from(jobAssignmentsTable)
    .leftJoin(partnerProfilesTable, eq(jobAssignmentsTable.partnerId, partnerProfilesTable.id))
    .leftJoin(usersTable, eq(partnerProfilesTable.userId, usersTable.id))
    .orderBy(desc(jobAssignmentsTable.createdAt));

  const filtered = status
    ? assignments.filter((a) => a.assignment.status === status)
    : assignments;

  res.json(
    filtered.map((a) => ({
      id: a.assignment.id,
      orderId: a.assignment.orderId,
      partnerId: a.assignment.partnerId,
      partnerName: a.partnerUser?.name || "파트너",
      partnerPhone: a.partnerUser?.phone || "",
      status: a.assignment.status,
      scheduledDate: a.assignment.scheduledDate,
      createdAt: a.assignment.createdAt,
    })),
  );
});

router.get("/admin/partners", requireAdmin, async (req, res): Promise<void> => {
  const { approvalStatus } = req.query;

  const partners = await db
    .select({ profile: partnerProfilesTable, user: usersTable })
    .from(partnerProfilesTable)
    .leftJoin(usersTable, eq(partnerProfilesTable.userId, usersTable.id))
    .orderBy(desc(partnerProfilesTable.createdAt));

  const filtered = approvalStatus
    ? partners.filter((p) => p.profile.approvalStatus === approvalStatus)
    : partners;

  res.json(
    filtered.map((p) => ({
      id: p.profile.id,
      userId: p.profile.userId,
      name: p.user?.name || "파트너",
      phone: p.user?.phone || "",
      email: p.user?.email || null,
      businessType: p.profile.businessType,
      grade: p.profile.grade,
      ratingAvg: parseFloat(String(p.profile.ratingAvg)) || 0,
      ratingCount: p.profile.ratingCount,
      approvalStatus: p.profile.approvalStatus,
      availabilityStatus: p.profile.availabilityStatus,
      approvalNote: p.profile.approvalNote,
      serviceArea: p.profile.serviceArea,
      career: p.profile.career,
      certifications: p.profile.certifications,
      experienceYears: p.profile.experienceYears,
      createdAt: p.profile.createdAt,
    })),
  );
});

router.post("/admin/partners/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { approvalStatus, note } = req.body;

  if (!approvalStatus) {
    res.status(400).json({ error: "승인 상태를 입력해주세요" });
    return;
  }

  const [partner] = await db
    .update(partnerProfilesTable)
    .set({ approvalStatus, approvalNote: note || null })
    .where(eq(partnerProfilesTable.id, id))
    .returning();

  if (!partner) {
    res.status(404).json({ error: "파트너를 찾을 수 없습니다" });
    return;
  }

  const [partnerData] = await db
    .select({ profile: partnerProfilesTable, user: usersTable })
    .from(partnerProfilesTable)
    .leftJoin(usersTable, eq(partnerProfilesTable.userId, usersTable.id))
    .where(eq(partnerProfilesTable.id, id));

  res.json({
    id: partnerData.profile.id,
    userId: partnerData.profile.userId,
    name: partnerData.user?.name || "파트너",
    phone: partnerData.user?.phone || "",
    businessType: partnerData.profile.businessType,
    grade: partnerData.profile.grade,
    ratingAvg: parseFloat(String(partnerData.profile.ratingAvg)) || 0,
    ratingCount: partnerData.profile.ratingCount,
    approvalStatus: partnerData.profile.approvalStatus,
    availabilityStatus: partnerData.profile.availabilityStatus,
    createdAt: partnerData.profile.createdAt,
  });
});

router.get("/admin/as-requests", requireAdmin, async (req, res): Promise<void> => {
  const { status } = req.query;

  const requests = await db
    .select()
    .from(asRequestsTable)
    .orderBy(desc(asRequestsTable.createdAt));

  const filtered = status
    ? requests.filter((r) => r.status === status)
    : requests;

  res.json(
    filtered.map((r) => ({
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

// ─── Admin: booking lookup / search ──────────────────────────────────────────
router.get("/admin/booking-lookup", requireAdmin, async (req, res): Promise<void> => {
  const { phone, orderNumber, status, dateFrom, dateTo } = req.query as Record<string, string>;

  // Build joined query: orders + customer user
  const allOrders = await db
    .select({
      id: ordersTable.id,
      orderNumber: ordersTable.orderNumber,
      packageName: ordersTable.packageName,
      status: ordersTable.status,
      totalPrice: ordersTable.totalPrice,
      roadAddress: ordersTable.roadAddress,
      detailAddress: ordersTable.detailAddress,
      scheduledDate: ordersTable.scheduledDate,
      requestNote: ordersTable.requestNote,
      createdAt: ordersTable.createdAt,
      customerId: ordersTable.customerId,
    })
    .from(ordersTable)
    .orderBy(desc(ordersTable.scheduledDate));

  // Filter in application layer for flexibility
  let filtered = allOrders;

  if (status) filtered = filtered.filter((o) => o.status === status);

  if (dateFrom) {
    const from = new Date(dateFrom);
    filtered = filtered.filter((o) => new Date(o.scheduledDate) >= from);
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    filtered = filtered.filter((o) => new Date(o.scheduledDate) <= to);
  }
  if (orderNumber) {
    const q = orderNumber.trim().toLowerCase();
    filtered = filtered.filter((o) => o.orderNumber.toLowerCase().includes(q));
  }

  // Enrich with customer info
  const customerIds = [...new Set(filtered.map((o) => o.customerId))];
  const customerUsers: Record<string, { name: string; phone: string }> = {};

  if (customerIds.length > 0) {
    const profiles = await db
      .select({
        id: customerProfilesTable.id,
        userId: customerProfilesTable.userId,
      })
      .from(customerProfilesTable)
      .where(
        customerIds.length === 1
          ? eq(customerProfilesTable.id, customerIds[0])
          : sql`${customerProfilesTable.id} = ANY(${customerIds})`
      );

    const userIds = profiles.map((p) => p.userId);
    if (userIds.length > 0) {
      const users = await db
        .select({ id: usersTable.id, name: usersTable.name, phone: usersTable.phone })
        .from(usersTable)
        .where(
          userIds.length === 1
            ? eq(usersTable.id, userIds[0])
            : sql`${usersTable.id} = ANY(${userIds})`
        );

      const userMap: Record<string, { name: string; phone: string }> = {};
      users.forEach((u) => { userMap[u.id] = { name: u.name, phone: u.phone }; });

      profiles.forEach((p) => {
        if (userMap[p.userId]) customerUsers[p.id] = userMap[p.userId];
      });
    }
  }

  // Apply phone filter after enrichment
  let result = filtered.map((o) => ({
    ...o,
    customerName: customerUsers[o.customerId]?.name,
    customerPhone: customerUsers[o.customerId]?.phone,
  }));

  if (phone) {
    const q = phone.trim();
    result = result.filter((o) => o.customerPhone?.includes(q));
  }

  res.json({ orders: result });
});

export default router;
