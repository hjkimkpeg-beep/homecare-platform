import { Router, type IRouter } from "express";
import bcryptjs from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, customerProfilesTable, partnerProfilesTable } from "@workspace/db";
import "../lib/session";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    res.status(400).json({ error: "전화번호와 비밀번호를 입력해주세요" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (!user) {
    res.status(401).json({ error: "전화번호 또는 비밀번호가 올바르지 않습니다" });
    return;
  }

  const valid = await bcryptjs.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "전화번호 또는 비밀번호가 올바르지 않습니다" });
    return;
  }

  if (user.status !== "active") {
    res.status(401).json({ error: "계정이 비활성화 상태입니다" });
    return;
  }

  req.session.userId = user.id;
  req.session.userRole = user.role;

  if (user.role === "customer") {
    const [profile] = await db
      .select()
      .from(customerProfilesTable)
      .where(eq(customerProfilesTable.userId, user.id));
    if (profile) {
      req.session.customerProfileId = profile.id;
    }
  }

  if (user.role === "partner") {
    const [profile] = await db
      .select()
      .from(partnerProfilesTable)
      .where(eq(partnerProfilesTable.userId, user.id));
    if (profile) {
      req.session.partnerProfileId = profile.id;
    }
  }

  res.json({
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt,
    },
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {});
  res.json({ success: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId));

  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.json({
    id: user.id,
    role: user.role,
    name: user.name,
    phone: user.phone,
    email: user.email,
    status: user.status,
    createdAt: user.createdAt,
  });
});

export default router;
