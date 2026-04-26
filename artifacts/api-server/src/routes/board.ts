import { Router, type IRouter } from "express";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import {
  db,
  boardPostsTable,
  boardCommentsTable,
  boardNotificationsTable,
  usersTable,
} from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import "../lib/session";

const router: IRouter = Router();

const BOARD_CATEGORIES = ["inquiry", "notice", "general", "complaint"] as const;
const BOARD_STATUSES = ["open", "answered", "closed"] as const;

function isBoardCategory(value: unknown): value is (typeof BOARD_CATEGORIES)[number] {
  return typeof value === "string" && BOARD_CATEGORIES.includes(value as (typeof BOARD_CATEGORIES)[number]);
}

function isBoardStatus(value: unknown): value is (typeof BOARD_STATUSES)[number] {
  return typeof value === "string" && BOARD_STATUSES.includes(value as (typeof BOARD_STATUSES)[number]);
}

const CATEGORY_LABELS: Record<string, string> = {
  inquiry: "문의",
  notice: "공지",
  general: "자유",
  complaint: "불만/개선",
};

const AI_REPLY_SYSTEM = `당신은 홈케어 서비스 고객센터 상담원입니다.
고객의 게시글에 대해 친절하고 전문적인 답변을 작성해주세요.

규칙:
- 공손하고 따뜻한 한국어 톤 유지
- 구체적인 해결책 또는 다음 단계 안내
- 200자 이내로 간결하게
- "안녕하세요, 홈케어 고객센터입니다."로 시작
- 불필요한 약속이나 거짓 정보 금지`;

function buildNotificationMessage(
  postTitle: string,
  replyContent: string,
  serviceName = "HomeCare",
): string {
  return `[${serviceName}] 고객님의 문의 "${postTitle}"에 답변이 등록되었습니다.\n\n${replyContent}\n\n감사합니다.`;
}

async function getSessionUser(req: any) {
  const userId: string | undefined = req.session.userId;
  const userRole: string | undefined = req.session.userRole;
  if (!userId) return null;
  return { id: userId, role: userRole ?? "customer" };
}

function parseIntParam(req: any, key: string): number | null {
  const value = req.params?.[key];
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

// ─── Public / Auth ──────────────────────────────────────────────────────────

router.get("/board", async (req, res): Promise<void> => {
  const {
    category,
    status,
    page = "1",
    limit = "20",
  } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  if (category && !isBoardCategory(category)) {
    res.status(400).json({ error: "유효하지 않은 category입니다" });
    return;
  }
  if (status && !isBoardStatus(status)) {
    res.status(400).json({ error: "유효하지 않은 status입니다" });
    return;
  }
  const categoryFilter = category && isBoardCategory(category) ? category : undefined;
  const statusFilter = status && isBoardStatus(status) ? status : undefined;

  const conditions = [isNull(boardPostsTable.deletedAt)];
  if (categoryFilter) conditions.push(eq(boardPostsTable.category, categoryFilter));
  if (statusFilter) conditions.push(eq(boardPostsTable.status, statusFilter));

  const posts = await db
    .select({
      id: boardPostsTable.id,
      title: boardPostsTable.title,
      category: boardPostsTable.category,
      status: boardPostsTable.status,
      isPinned: boardPostsTable.isPinned,
      isSecret: boardPostsTable.isSecret,
      authorName: boardPostsTable.authorName,
      authorType: boardPostsTable.authorType,
      viewCount: boardPostsTable.viewCount,
      createdAt: boardPostsTable.createdAt,
      commentCount: sql<number>`(
        SELECT COUNT(*) FROM board_comments bc
        WHERE bc.post_id = ${boardPostsTable.id} AND bc.deleted_at IS NULL
      )`.as("comment_count"),
    })
    .from(boardPostsTable)
    .where(and(...conditions))
    .orderBy(desc(boardPostsTable.isPinned), desc(boardPostsTable.createdAt))
    .limit(parseInt(limit))
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(boardPostsTable)
    .where(and(...conditions));

  res.json({ posts, total, page: parseInt(page), limit: parseInt(limit) });
});

router.get("/board/:postId", requireAuth, async (req, res): Promise<void> => {
  const postId = parseIntParam(req, "postId");
  if (postId === null) {
    res.status(400).json({ error: "유효하지 않은 postId입니다" });
    return;
  }
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [post] = await db
    .select()
    .from(boardPostsTable)
    .where(and(eq(boardPostsTable.id, postId), isNull(boardPostsTable.deletedAt)));

  if (!post) {
    res.status(404).json({ error: "게시글을 찾을 수 없습니다" });
    return;
  }

  const isAdmin = sessionUser.role === "admin" || sessionUser.role === "operator";

  if (post.isSecret && post.userId !== sessionUser.id && !isAdmin) {
    res.status(403).json({ error: "비밀글입니다" });
    return;
  }

  await db
    .update(boardPostsTable)
    .set({ viewCount: post.viewCount + 1 })
    .where(eq(boardPostsTable.id, postId));

  const comments = await db
    .select()
    .from(boardCommentsTable)
    .where(
      and(
        eq(boardCommentsTable.postId, postId),
        isNull(boardCommentsTable.deletedAt),
      ),
    )
    .orderBy(boardCommentsTable.createdAt);

  res.json({ ...post, viewCount: post.viewCount + 1, comments });
});

router.post("/board", requireAuth, async (req, res): Promise<void> => {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { title, content, category, isSecret } = req.body as {
    title: string;
    content: string;
    category?: string;
    isSecret?: boolean;
  };

  if (!title?.trim() || !content?.trim()) {
    res.status(400).json({ error: "제목과 내용을 입력해주세요" });
    return;
  }
  if (category !== undefined && !isBoardCategory(category)) {
    res.status(400).json({ error: "유효하지 않은 category입니다" });
    return;
  }

  const [dbUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, sessionUser.id));

  if (!dbUser) {
    res.status(401).json({ error: "사용자를 찾을 수 없습니다" });
    return;
  }

  const authorType =
    sessionUser.role === "admin" || sessionUser.role === "operator"
      ? "admin"
      : sessionUser.role === "partner"
      ? "partner"
      : "customer";

  const [post] = await db
    .insert(boardPostsTable)
    .values({
      userId: sessionUser.id,
      authorName: dbUser.name,
      authorType,
      title: title.trim(),
      content: content.trim(),
      category: category ?? "general",
      isSecret: isSecret ?? false,
      contactPhone: dbUser.phone ?? null,
    })
    .returning();

  res.status(201).json(post);
});

router.patch("/board/:postId", requireAuth, async (req, res): Promise<void> => {
  const postId = parseIntParam(req, "postId");
  if (postId === null) {
    res.status(400).json({ error: "유효하지 않은 postId입니다" });
    return;
  }
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: "Unauthorized" }); return; }
  const isAdmin = sessionUser.role === "admin" || sessionUser.role === "operator";

  const [post] = await db
    .select()
    .from(boardPostsTable)
    .where(and(eq(boardPostsTable.id, postId), isNull(boardPostsTable.deletedAt)));

  if (!post) {
    res.status(404).json({ error: "게시글을 찾을 수 없습니다" });
    return;
  }

  if (!isAdmin && post.userId !== sessionUser.id) {
    res.status(403).json({ error: "수정 권한이 없습니다" });
    return;
  }

  const { title, content, category, isSecret } = req.body as any;
  if (category !== undefined && !isBoardCategory(category)) {
    res.status(400).json({ error: "유효하지 않은 category입니다" });
    return;
  }
  const [updated] = await db
    .update(boardPostsTable)
    .set({
      ...(title ? { title: title.trim() } : {}),
      ...(content ? { content: content.trim() } : {}),
      ...(category ? { category } : {}),
      ...(isSecret !== undefined ? { isSecret } : {}),
    })
    .where(eq(boardPostsTable.id, postId))
    .returning();

  res.json(updated);
});

router.delete("/board/:postId", requireAuth, async (req, res): Promise<void> => {
  const postId = parseIntParam(req, "postId");
  if (postId === null) {
    res.status(400).json({ error: "유효하지 않은 postId입니다" });
    return;
  }
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: "Unauthorized" }); return; }
  const isAdmin = sessionUser.role === "admin" || sessionUser.role === "operator";

  const [post] = await db
    .select()
    .from(boardPostsTable)
    .where(and(eq(boardPostsTable.id, postId), isNull(boardPostsTable.deletedAt)));

  if (!post) {
    res.status(404).json({ error: "게시글을 찾을 수 없습니다" });
    return;
  }

  if (!isAdmin && post.userId !== sessionUser.id) {
    res.status(403).json({ error: "삭제 권한이 없습니다" });
    return;
  }

  await db
    .update(boardPostsTable)
    .set({ deletedAt: new Date() })
    .where(eq(boardPostsTable.id, postId));

  res.status(204).send();
});

// ─── Comments ────────────────────────────────────────────────────────────────

router.post(
  "/board/:postId/comments",
  requireAuth,
  async (req, res): Promise<void> => {
    const postId = parseIntParam(req, "postId");
    if (postId === null) {
      res.status(400).json({ error: "유효하지 않은 postId입니다" });
      return;
    }
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) { res.status(401).json({ error: "Unauthorized" }); return; }
    const isAdmin = sessionUser.role === "admin" || sessionUser.role === "operator";

    const [post] = await db
      .select()
      .from(boardPostsTable)
      .where(and(eq(boardPostsTable.id, postId), isNull(boardPostsTable.deletedAt)));

    if (!post) {
      res.status(404).json({ error: "게시글을 찾을 수 없습니다" });
      return;
    }

    const { content } = req.body as { content: string };
    if (!content?.trim()) {
      res.status(400).json({ error: "내용을 입력해주세요" });
      return;
    }

    const [dbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, sessionUser.id));

    if (!dbUser) {
      res.status(401).json({ error: "사용자를 찾을 수 없습니다" });
      return;
    }

    const authorType = isAdmin
      ? "admin"
      : sessionUser.role === "partner"
      ? "partner"
      : "customer";

    const [comment] = await db
      .insert(boardCommentsTable)
      .values({
        postId,
        userId: sessionUser.id,
        authorName: dbUser.name,
        authorType,
        content: content.trim(),
      })
      .returning();

    if (isAdmin && post.status === "open") {
      await db
        .update(boardPostsTable)
        .set({ status: "answered" })
        .where(eq(boardPostsTable.id, postId));
    }

    if (
      isAdmin &&
      post.category === "inquiry" &&
      post.contactPhone &&
      post.userId !== sessionUser.id
    ) {
      const messageContent = buildNotificationMessage(post.title, content.trim());
      await db.insert(boardNotificationsTable).values({
        postId,
        commentId: comment.id,
        recipientName: post.authorName,
        recipientPhone: post.contactPhone,
        messageContent,
      });
    }

    res.status(201).json(comment);
  },
);

router.patch(
  "/board/:postId/comments/:commentId",
  requireAuth,
  async (req, res): Promise<void> => {
    const postId = parseIntParam(req, "postId");
    const commentId = parseIntParam(req, "commentId");
    if (postId === null || commentId === null) {
      res.status(400).json({ error: "유효하지 않은 경로 파라미터입니다" });
      return;
    }
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) { res.status(401).json({ error: "Unauthorized" }); return; }
    const isAdmin = sessionUser.role === "admin" || sessionUser.role === "operator";

    const [comment] = await db
      .select()
      .from(boardCommentsTable)
      .where(
        and(
          eq(boardCommentsTable.id, commentId),
          eq(boardCommentsTable.postId, postId),
          isNull(boardCommentsTable.deletedAt),
        ),
      );

    if (!comment) {
      res.status(404).json({ error: "댓글을 찾을 수 없습니다" });
      return;
    }

    if (!isAdmin && comment.userId !== sessionUser.id) {
      res.status(403).json({ error: "수정 권한이 없습니다" });
      return;
    }

    const { content } = req.body as { content: string };
    const [updated] = await db
      .update(boardCommentsTable)
      .set({ content: content.trim(), isAiGenerated: false })
      .where(eq(boardCommentsTable.id, commentId))
      .returning();

    res.json(updated);
  },
);

router.delete(
  "/board/:postId/comments/:commentId",
  requireAuth,
  async (req, res): Promise<void> => {
    const postId = parseIntParam(req, "postId");
    const commentId = parseIntParam(req, "commentId");
    if (postId === null || commentId === null) {
      res.status(400).json({ error: "유효하지 않은 경로 파라미터입니다" });
      return;
    }
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) { res.status(401).json({ error: "Unauthorized" }); return; }
    const isAdmin = sessionUser.role === "admin" || sessionUser.role === "operator";

    const [comment] = await db
      .select()
      .from(boardCommentsTable)
      .where(
        and(
          eq(boardCommentsTable.id, commentId),
          eq(boardCommentsTable.postId, postId),
          isNull(boardCommentsTable.deletedAt),
        ),
      );

    if (!comment) {
      res.status(404).json({ error: "댓글을 찾을 수 없습니다" });
      return;
    }

    if (!isAdmin && comment.userId !== sessionUser.id) {
      res.status(403).json({ error: "삭제 권한이 없습니다" });
      return;
    }

    await db
      .update(boardCommentsTable)
      .set({ deletedAt: new Date() })
      .where(eq(boardCommentsTable.id, commentId));

    res.status(204).send();
  },
);

// ─── AI Reply ────────────────────────────────────────────────────────────────

router.post(
  "/board/:postId/ai-reply",
  requireAdmin,
  async (req, res): Promise<void> => {
    const postId = parseIntParam(req, "postId");
    if (postId === null) {
      res.status(400).json({ error: "유효하지 않은 postId입니다" });
      return;
    }

    const [post] = await db
      .select()
      .from(boardPostsTable)
      .where(and(eq(boardPostsTable.id, postId), isNull(boardPostsTable.deletedAt)));

    if (!post) {
      res.status(404).json({ error: "게시글을 찾을 수 없습니다" });
      return;
    }

    const categoryLabel = CATEGORY_LABELS[post.category] ?? post.category;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 512,
      messages: [
        { role: "system", content: AI_REPLY_SYSTEM },
        {
          role: "user",
          content: `[${categoryLabel}] ${post.title}\n\n${post.content}`,
        },
      ],
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    res.json({ reply });
  },
);

// ─── Admin: Pin / Status ──────────────────────────────────────────────────────

router.patch(
  "/admin/board/:postId/pin",
  requireAdmin,
  async (req, res): Promise<void> => {
    const postId = parseIntParam(req, "postId");
    if (postId === null) {
      res.status(400).json({ error: "유효하지 않은 postId입니다" });
      return;
    }
    const { isPinned } = req.body as { isPinned: boolean };

    await db
      .update(boardPostsTable)
      .set({ isPinned })
      .where(eq(boardPostsTable.id, postId));

    res.json({ ok: true });
  },
);

router.patch(
  "/admin/board/:postId/status",
  requireAdmin,
  async (req, res): Promise<void> => {
    const postId = parseIntParam(req, "postId");
    if (postId === null) {
      res.status(400).json({ error: "유효하지 않은 postId입니다" });
      return;
    }
    const { status } = req.body as { status: string };
    if (!isBoardStatus(status)) {
      res.status(400).json({ error: "유효하지 않은 status입니다" });
      return;
    }

    const [updated] = await db
      .update(boardPostsTable)
      .set({ status })
      .where(eq(boardPostsTable.id, postId))
      .returning();

    res.json(updated);
  },
);

// ─── Admin: Notifications ─────────────────────────────────────────────────────

router.get(
  "/admin/board/notifications",
  requireAdmin,
  async (req, res): Promise<void> => {
    const { sent } = req.query as { sent?: string };
    const notifications = await db
      .select()
      .from(boardNotificationsTable)
      .where(
        sent === "true"
          ? eq(boardNotificationsTable.isSent, true)
          : eq(boardNotificationsTable.isSent, false),
      )
      .orderBy(desc(boardNotificationsTable.createdAt))
      .limit(50);

    res.json(notifications);
  },
);

router.patch(
  "/admin/board/notifications/:id/sent",
  requireAdmin,
  async (req, res): Promise<void> => {
    const id = parseIntParam(req, "id");
    if (id === null) {
      res.status(400).json({ error: "유효하지 않은 id입니다" });
      return;
    }
    const [updated] = await db
      .update(boardNotificationsTable)
      .set({ isSent: true, sentAt: new Date() })
      .where(eq(boardNotificationsTable.id, id))
      .returning();
    res.json(updated);
  },
);

export default router;
