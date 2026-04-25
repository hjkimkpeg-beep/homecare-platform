import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  packageAiVideosTable,
  servicePackagesTable,
  packageTasksTable,
  packageStandardManualsTable,
} from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireAdmin } from "../middlewares/auth";
import { extractTextFromManual } from "../lib/extractManualText";
import "../lib/session";

const router: IRouter = Router();

const VIDEO_SCRIPT_PROMPT = `당신은 홈케어 서비스 교육 영상 전문가입니다.
아래 서비스 매뉴얼 내용을 기반으로, 파트너(기술자)와 고객 모두가 이해할 수 있는
6단계 서비스 안내 영상 스크립트를 JSON 배열로 작성해주세요.

응답은 반드시 순수 JSON 배열만 출력하세요. 다른 텍스트는 포함하지 마세요.

각 단계 형식:
{
  "step": 번호(1~6),
  "title": "단계 제목 (10자 이내)",
  "description": "단계 설명 (60자 이내, 파트너가 해야 할 일 또는 고객이 알아야 할 사항)",
  "emoji": "관련 이모지 1개"
}

6단계 구성 가이드:
1단계: 서비스 소개/개요
2단계: 사전 준비 (고객/파트너)
3단계: 작업 시작
4단계: 핵심 작업 과정
5단계: 점검 및 마무리
6단계: A/S 보증 및 완료 확인`;

router.post(
  "/packages/:packageId/generate-video",
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

    const [existing] = await db
      .select()
      .from(packageAiVideosTable)
      .where(eq(packageAiVideosTable.packageId, packageId));

    if (existing) {
      await db
        .update(packageAiVideosTable)
        .set({ status: "pending", script: null, errorMessage: null, updatedAt: new Date() })
        .where(eq(packageAiVideosTable.packageId, packageId));
    } else {
      await db.insert(packageAiVideosTable).values({ packageId, status: "pending" });
    }

    res.json({ status: "pending", message: "동영상 스크립트 생성을 시작했습니다" });

    try {
      const [standardManual] = await db
        .select()
        .from(packageStandardManualsTable)
        .where(eq(packageStandardManualsTable.packageId, packageId));

      let contentForAI: string;
      let sourceLabel: string;

      if (standardManual) {
        try {
          const extractedText = await extractTextFromManual(
            standardManual.objectPath,
            standardManual.fileType,
          );
          const truncated = extractedText.slice(0, 8000);
          contentForAI = `서비스명: ${pkg.name}\n\n[표준 매뉴얼 내용]\n${truncated}`;
          sourceLabel = `표준 매뉴얼(${standardManual.originalName}) 기반`;
        } catch (extractErr) {
          const tasks = await db
            .select()
            .from(packageTasksTable)
            .where(eq(packageTasksTable.packageId, packageId));
          contentForAI = `패키지명: ${pkg.name}\n설명: ${pkg.description}\n소요시간: ${pkg.estimatedMinutes}분\n주요 작업: ${tasks.map((t) => t.task).join(", ")}`;
          sourceLabel = "패키지 정보 기반 (매뉴얼 추출 실패)";
        }
      } else {
        const tasks = await db
          .select()
          .from(packageTasksTable)
          .where(eq(packageTasksTable.packageId, packageId));
        contentForAI = `패키지명: ${pkg.name}\n설명: ${pkg.description}\n소요시간: ${pkg.estimatedMinutes}분\nA/S 보증: ${pkg.asWarrantyDays}일\n주요 작업: ${tasks.map((t) => t.task).join(", ")}\n가격: ${pkg.basePrice.toLocaleString("ko-KR")}원`;
        sourceLabel = "패키지 정보 기반";
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        max_completion_tokens: 2048,
        messages: [
          { role: "system", content: VIDEO_SCRIPT_PROMPT },
          { role: "user", content: contentForAI },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? "[]";
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      const script = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      await db
        .update(packageAiVideosTable)
        .set({ status: "ready", script, updatedAt: new Date() })
        .where(eq(packageAiVideosTable.packageId, packageId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "생성 실패";
      await db
        .update(packageAiVideosTable)
        .set({ status: "error", errorMessage: msg, updatedAt: new Date() })
        .where(eq(packageAiVideosTable.packageId, packageId));
    }
  },
);

router.get("/packages/:packageId/video", async (req, res): Promise<void> => {
  const { packageId } = req.params;

  const [video] = await db
    .select()
    .from(packageAiVideosTable)
    .where(eq(packageAiVideosTable.packageId, packageId));

  if (!video) {
    res.status(404).json({ error: "생성된 동영상이 없습니다" });
    return;
  }

  res.json(video);
});

export default router;
