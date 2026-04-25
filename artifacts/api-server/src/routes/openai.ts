import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireAuth } from "../middlewares/auth";
import "../lib/session";

const router: IRouter = Router();

const CHATBOT_SYSTEM_PROMPT = `당신은 '홈케어 플랫폼'의 고객 상담 AI 어시스턴트입니다. 친절하고 전문적인 한국어로 답변합니다.

## 서비스 패키지 정보

1. **에어컨 클리닝** - 표준 에어컨 필터 및 내부 청소
   - 가격: 80,000원 (벽걸이형), 100,000원 (스탠드형)
   - 소요시간: 1~2시간

2. **보일러/난방 점검** - 보일러 청소 및 안전 점검
   - 가격: 70,000원
   - 소요시간: 1시간

3. **욕실 실리콘 보수** - 욕실 타일, 변기 주변 실리콘 재시공
   - 가격: 50,000원~80,000원 (면적에 따라)
   - 소요시간: 1~2시간

4. **도배/장판** - 방 전체 도배 및 장판 교체
   - 가격: 별도 견적 (평수에 따라)
   - 소요시간: 1일

5. **전기 점검** - 전기 콘센트, 조명, 차단기 점검
   - 가격: 50,000원 (기본)
   - 소요시간: 1시간

## 예약 방법
- 홈케어 플랫폼 앱/웹사이트에서 원하는 패키지를 선택
- 원하는 날짜와 시간 선택
- 주소 입력 후 결제 (카드/현금 가능)
- 예약 확인 후 담당 파트너가 배정됩니다

## 자주 묻는 질문
- 예약 취소: 서비스 24시간 전까지 무료 취소 가능
- 결제: 신용카드, 현금 모두 가능. 현금의 경우 환불 계좌 등록 필요
- A/S: 서비스 완료 후 7일 이내 문제 발생 시 무상 A/S 제공
- 파트너: 검증된 전문 파트너만 등록, 평균 평점 4.5점 이상 유지

고객의 질문에 친절하고 정확하게 답변하세요. 모르는 내용은 솔직하게 모른다고 하고, 고객센터(1588-0000)로 안내하세요.`;

const MARKETING_SYSTEM_PROMPT = `당신은 홈케어 플랫폼의 마케팅 전문가입니다. 
주어진 조건에 맞는 효과적인 마케팅 문구를 한국어로 작성합니다.

채널별 특성:
- 카카오톡: 친근하고 간결, 이모지 활용, 최대 100자 내외
- SMS: 매우 간결, 핵심만, 60자 이내
- 소셜미디어: 해시태그 포함, 감성적, 시각적 요소 고려
- 이메일: 정중하고 상세한 정보, 제목+본문 구조

고객 유형별 접근:
- 신혼부부: 새 보금자리 관리, 깔끔함, 편리함 강조
- 노년층: 안전, 신뢰, 편리한 연락 강조
- 직장인: 시간 절약, 전문성, 빠른 처리 강조
- 가족: 위생, 안전, 가족 건강 강조`;

router.get("/openai/conversations", requireAuth, async (req, res): Promise<void> => {
  const list = await db
    .select()
    .from(conversations)
    .orderBy(asc(conversations.createdAt));
  res.json(list);
});

router.post("/openai/conversations", async (req, res): Promise<void> => {
  const { title } = req.body as { title: string };
  if (!title) {
    res.status(400).json({ error: "title이 필요합니다" });
    return;
  }
  const [conv] = await db.insert(conversations).values({ title }).returning();
  res.status(201).json(conv);
});

router.get("/openai/conversations/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "잘못된 id입니다" });
    return;
  }
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "대화를 찾을 수 없습니다" });
    return;
  }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));
  res.json({ ...conv, messages: msgs });
});

router.post("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "잘못된 id입니다" });
    return;
  }
  const { content } = req.body as { content: string };
  if (!content) {
    res.status(400).json({ error: "content가 필요합니다" });
    return;
  }

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "대화를 찾을 수 없습니다" });
    return;
  }

  await db.insert(messages).values({ conversationId: id, role: "user", content });

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const stream = await openai.chat.completions.create({
    model: "gpt-4.1",
    max_completion_tokens: 8192,
    stream: true,
    messages: [
      { role: "system", content: CHATBOT_SYSTEM_PROMPT },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
  });

  let assistantContent = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      assistantContent += delta;
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
  }

  await db.insert(messages).values({
    conversationId: id,
    role: "assistant",
    content: assistantContent,
  });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

router.post("/openai/marketing/generate", requireAuth, async (req, res): Promise<void> => {
  const isAdmin = req.session.userRole === "admin";
  if (!isAdmin) {
    res.status(403).json({ error: "관리자만 이용 가능합니다" });
    return;
  }

  const { packageName, targetAudience, channel, tone, additionalContext } = req.body as {
    packageName?: string;
    targetAudience: string;
    channel: string;
    tone: string;
    additionalContext?: string;
  };

  if (!targetAudience || !channel || !tone) {
    res.status(400).json({ error: "targetAudience, channel, tone은 필수입니다" });
    return;
  }

  const userPrompt = `다음 조건으로 마케팅 문구를 작성해주세요:
- 서비스 패키지: ${packageName ?? "전체 홈케어 서비스"}
- 대상 고객: ${targetAudience}
- 채널: ${channel}
- 톤앤매너: ${tone}
${additionalContext ? `- 추가 요청사항: ${additionalContext}` : ""}

마케팅 문구를 3가지 버전으로 작성해주세요.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const stream = await openai.chat.completions.create({
    model: "gpt-4.1",
    max_completion_tokens: 8192,
    stream: true,
    messages: [
      { role: "system", content: MARKETING_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;
