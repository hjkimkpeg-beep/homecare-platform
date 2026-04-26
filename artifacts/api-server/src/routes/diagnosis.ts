import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, remoteDiagnosisTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";
import "../lib/session";

const router: IRouter = Router();

const DIAGNOSIS_PROBLEM_TYPES = [
  "leak",
  "drain",
  "boiler",
  "aircon",
  "electrical",
  "other",
] as const;

const DIAGNOSIS_STATUSES = [
  "received",
  "reviewing",
  "visit_scheduled",
  "completed",
  "cancelled",
] as const;

function isDiagnosisProblemType(
  value: unknown,
): value is (typeof DIAGNOSIS_PROBLEM_TYPES)[number] {
  return (
    typeof value === "string" &&
    DIAGNOSIS_PROBLEM_TYPES.includes(value as (typeof DIAGNOSIS_PROBLEM_TYPES)[number])
  );
}

function isDiagnosisStatus(value: unknown): value is (typeof DIAGNOSIS_STATUSES)[number] {
  return (
    typeof value === "string" &&
    DIAGNOSIS_STATUSES.includes(value as (typeof DIAGNOSIS_STATUSES)[number])
  );
}

// Diagnosis rules for rule-based engine
const diagnosisRules: Record<string, {
  label: string;
  possibleCauses: string;
  recommendedAction: string;
  estimatedCost: string;
  urgency: string;
  videoTitle: string;
}> = {
  leak: {
    label: "누수",
    possibleCauses: "배관 연결부 패킹 손상, 조인트 느슨함, 또는 내부 배관 균열 가능성",
    recommendedAction: "연결부 확인 및 패킹 교체, 내부 누수 의심 시 현장 방문 점검 필요",
    estimatedCost: "50,000 ~ 150,000원",
    urgency: "보통 ~ 긴급",
    videoTitle: "싱크대 및 배관 누수 점검 방법",
  },
  drain: {
    label: "배수 막힘",
    possibleCauses: "배수구 또는 하부 배관 이물질 막힘, 트랩 문제 가능성",
    recommendedAction: "배수구 청소, 트랩 점검, 배관 세척 필요",
    estimatedCost: "70,000 ~ 180,000원",
    urgency: "보통",
    videoTitle: "배수구 막힘 원인과 점검 방법",
  },
  boiler: {
    label: "보일러 / 온수 문제",
    possibleCauses: "보일러 압력 불량, 센서 이상, 점화 문제, 또는 열교환기 이상 가능성",
    recommendedAction: "에러코드 확인 후 전문 기사 점검 권장",
    estimatedCost: "80,000 ~ 250,000원",
    urgency: "보통 ~ 긴급",
    videoTitle: "보일러 온수 불량 기본 점검 방법",
  },
  aircon: {
    label: "에어컨 / 환기 문제",
    possibleCauses: "배수관 막힘, 필터 오염, 팬 이상, 또는 냉매 부족 가능성",
    recommendedAction: "필터 및 배수관 상태 확인, 필요 시 현장 방문 점검",
    estimatedCost: "70,000 ~ 200,000원",
    urgency: "보통",
    videoTitle: "에어컨 물 떨어짐 및 풍량 저하 점검 방법",
  },
  electrical: {
    label: "전기 / 차단기 문제",
    possibleCauses: "과부하, 누전, 노후 배선, 또는 기기 자체 불량 가능성",
    recommendedAction: "안전상 위험 가능성이 있으므로 전문 기사 방문 점검 필요",
    estimatedCost: "80,000 ~ 250,000원",
    urgency: "긴급 가능",
    videoTitle: "차단기 트립 시 안전 점검 방법",
  },
  other: {
    label: "기타",
    possibleCauses: "입력 정보 기반 상세 진단이 어려운 유형입니다",
    recommendedAction: "증상을 사진/영상과 함께 제출하면 담당자가 검토 후 연락드립니다",
    estimatedCost: "방문 점검 후 산정",
    urgency: "확인 필요",
    videoTitle: "",
  },
};

// Submit a new diagnosis request (public, no auth required)
router.post("/diagnosis", async (req, res): Promise<void> => {
  const {
    customerName, phone, address, preferredDate, isUrgent,
    problemType, description, checklistAnswers, uploadedFiles,
  } = req.body;

  if (!customerName || !phone || !address || !problemType) {
    res.status(400).json({ error: "필수 항목이 누락되었습니다" });
    return;
  }
  if (!isDiagnosisProblemType(problemType)) {
    res.status(400).json({ error: "유효하지 않은 problemType입니다" });
    return;
  }

  const rules = diagnosisRules[problemType] ?? diagnosisRules.other;

  const diagnosisResult = {
    label: rules.label,
    possibleCauses: rules.possibleCauses,
    recommendedAction: rules.recommendedAction,
    urgency: rules.urgency,
    videoTitle: rules.videoTitle,
    disclaimer: "본 결과는 입력 정보 기반의 1차 진단이며, 정확한 수리는 현장 방문 점검이 필요할 수 있습니다.",
  };

  const [record] = await db
    .insert(remoteDiagnosisTable)
    .values({
      customerName,
      phone,
      address,
      preferredDate: preferredDate ?? null,
      isUrgent: isUrgent ?? "no",
      problemType,
      description: description ?? null,
      checklistAnswers: checklistAnswers ?? null,
      uploadedFiles: uploadedFiles ?? null,
      diagnosisResult,
      estimatedCost: rules.estimatedCost,
      urgency: rules.urgency,
      status: "received",
    })
    .returning();

  res.status(201).json(record);
});

// Admin: list all diagnosis requests
router.get("/admin/diagnosis", requireAdmin, async (req, res): Promise<void> => {
  const { status, problemType } = req.query as Record<string, string>;
  if (status && !isDiagnosisStatus(status)) {
    res.status(400).json({ error: "유효하지 않은 status입니다" });
    return;
  }
  if (problemType && !isDiagnosisProblemType(problemType)) {
    res.status(400).json({ error: "유효하지 않은 problemType입니다" });
    return;
  }

  const all = await db
    .select()
    .from(remoteDiagnosisTable)
    .orderBy(desc(remoteDiagnosisTable.createdAt));

  const filtered = all.filter((r) => {
    if (status && r.status !== status) return false;
    if (problemType && r.problemType !== problemType) return false;
    return true;
  });

  res.json(filtered);
});

// Admin: update status
router.patch("/admin/diagnosis/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { status } = req.body;

  if (!status) {
    res.status(400).json({ error: "status는 필수입니다" });
    return;
  }
  if (!isDiagnosisStatus(status)) {
    res.status(400).json({ error: "유효하지 않은 status입니다" });
    return;
  }

  const [updated] = await db
    .update(remoteDiagnosisTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(remoteDiagnosisTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "요청을 찾을 수 없습니다" });
    return;
  }

  res.json(updated);
});

export default router;
