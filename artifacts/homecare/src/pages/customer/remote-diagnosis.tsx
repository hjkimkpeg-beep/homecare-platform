import { useState, useRef } from "react";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { useCreateDiagnosisRequest, useRequestUploadUrl } from "@workspace/api-client-react";
import {
  Activity, Camera, CheckSquare, ChevronRight, AlertTriangle,
  Droplets, Wind, Zap, Flame, Loader2, CheckCircle2,
  Upload, X, PhoneCall, ArrowRight, ArrowLeft,
  ClipboardCheck, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── 문제 유형 ────────────────────────────────────────────────────────────
type ProblemType = "leak" | "drain" | "boiler" | "aircon" | "electrical" | "other";

const PROBLEM_TYPES: {
  id: ProblemType;
  label: string;
  icon: typeof Droplets;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  { id: "leak", label: "누수", icon: Droplets, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  { id: "drain", label: "배수 막힘", icon: Activity, color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" },
  { id: "boiler", label: "보일러 / 온수", icon: Flame, color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
  { id: "aircon", label: "에어컨 / 환기", icon: Wind, color: "text-cyan-600", bgColor: "bg-cyan-50", borderColor: "border-cyan-200" },
  { id: "electrical", label: "전기 / 차단기", icon: Zap, color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" },
  { id: "other", label: "기타", icon: AlertCircle, color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200" },
];

// ── 체크리스트 ────────────────────────────────────────────────────────────
const CHECKLISTS: Record<ProblemType, string[]> = {
  leak: [
    "물이 계속 새고 있나요?",
    "물을 사용할 때만 새나요?",
    "벽이나 천장이 젖어 있나요?",
    "최근 공사나 충격이 있었나요?",
  ],
  drain: [
    "물이 천천히 빠지나요?",
    "물이 전혀 빠지지 않나요?",
    "악취가 있나요?",
    "다른 배수구도 동시에 막혔나요?",
  ],
  boiler: [
    "온수가 전혀 나오지 않나요?",
    "난방은 정상인가요?",
    "보일러에 에러코드가 표시되나요?",
    "압력계가 비정상 범위인가요?",
  ],
  aircon: [
    "찬바람이 약한가요?",
    "실내기에서 물이 떨어지나요?",
    "이상 소음이 있나요?",
    "필터 청소를 최근에 했나요?",
  ],
  electrical: [
    "차단기가 반복적으로 내려가나요?",
    "특정 기기를 사용할 때만 문제가 발생하나요?",
    "콘센트에 그을림이나 냄새가 있나요?",
    "전체 정전인가요, 일부 공간만 문제인가요?",
  ],
  other: [
    "증상이 갑자기 시작되었나요?",
    "최근 공사나 새 기기를 설치했나요?",
    "비슷한 증상이 이전에도 있었나요?",
  ],
};

// ── 진단 결과 구조 ──────────────────────────────────────────────────────
interface DiagnosisResult {
  label: string;
  possibleCauses: string;
  recommendedAction: string;
  urgency: string;
  videoTitle: string;
  disclaimer: string;
}

interface UploadedFile {
  name: string;
  objectPath: string;
  url: string;
  type: string;
}

type Step = "info" | "problem" | "checklist" | "result";

export default function RemoteDiagnosisPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Step
  const [step, setStep] = useState<Step>("info");

  // Step 1: Basic info
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [isUrgent, setIsUrgent] = useState("no");

  // Step 2: Problem type + description
  const [problemType, setProblemType] = useState<ProblemType | null>(null);
  const [description, setDescription] = useState("");

  // Step 3: Checklist + file upload
  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, boolean>>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 4: Result
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const createDiagnosis = useCreateDiagnosisRequest();
  const requestUploadUrl = useRequestUploadUrl();

  // Validate steps
  function canProceedFromInfo() {
    return customerName.trim() && phone.trim() && address.trim();
  }
  function canProceedFromProblem() {
    return problemType !== null;
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const { uploadURL, objectPath } = await requestUploadUrl.mutateAsync({
          data: { name: file.name, size: file.size, contentType: file.type || "application/octet-stream" },
        });
        const res = await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        if (!res.ok) throw new Error("파일 업로드 실패");
        setUploadedFiles((prev) => [
          ...prev,
          { name: file.name, objectPath, url: `${BASE}/api/storage${objectPath}`, type: file.type },
        ]);
      }
      toast({ title: `${files.length}개 파일이 업로드되었습니다` });
    } catch {
      toast({ title: "파일 업로드에 실패했습니다", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function toggleChecklist(question: string) {
    setChecklistAnswers((prev) => ({ ...prev, [question]: !prev[question] }));
  }

  async function handleSubmit() {
    if (!problemType) return;
    try {
      const result = await createDiagnosis.mutateAsync({
        data: {
          customerName,
          phone,
          address,
          preferredDate: preferredDate || undefined,
          isUrgent,
          problemType,
          description: description || undefined,
          checklistAnswers,
          uploadedFiles: uploadedFiles.map((f) => ({ name: f.name, url: f.url, type: f.type })),
        },
      });
      setSubmittedId(result.id);
      setDiagnosisResult(result.diagnosisResult as DiagnosisResult);
      setStep("result");
    } catch {
      toast({ title: "제출에 실패했습니다. 다시 시도해 주세요", variant: "destructive" });
    }
  }

  const checklist = problemType ? CHECKLISTS[problemType] : [];
  const problemInfo = PROBLEM_TYPES.find((p) => p.id === problemType);

  return (
    <CustomerLayout>
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">원격 점검</h1>
            <p className="text-sm text-gray-500">사진과 증상 정보로 1차 진단을 받으세요</p>
          </div>
        </div>

        {/* Step indicator */}
        {step !== "result" && (
          <div className="flex items-center gap-2 mb-6">
            {(["info", "problem", "checklist"] as const).map((s, idx) => {
              const stepIdx = ["info", "problem", "checklist"].indexOf(step);
              const isActive = s === step;
              const isDone = idx < stepIdx;
              return (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isDone ? "bg-blue-600 text-white" : isActive ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-gray-200 text-gray-500"
                  }`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  {idx < 2 && <div className={`flex-1 h-0.5 ${isDone ? "bg-blue-600" : "bg-gray-200"}`} />}
                </div>
              );
            })}
          </div>
        )}

        {/* ── STEP 1: 기본 정보 ── */}
        {step === "info" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">기본 정보 입력</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">이름 *</label>
                <Input placeholder="홍길동" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">연락처 *</label>
                <Input placeholder="010-0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">주소 / 지역 *</label>
                <Input placeholder="예) 서울시 강남구 역삼동" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">희망 방문일 (선택)</label>
                <Input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">긴급 여부</label>
                <div className="flex gap-3">
                  {[{ value: "no", label: "일반" }, { value: "yes", label: "긴급" }].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setIsUrgent(opt.value)}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        isUrgent === opt.value
                          ? opt.value === "yes"
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-500"
                      }`}
                    >
                      {opt.value === "yes" && <AlertTriangle className="w-4 h-4 inline mr-1.5" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Button
              className="w-full mt-2"
              disabled={!canProceedFromInfo()}
              onClick={() => setStep("problem")}
            >
              다음 <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        )}

        {/* ── STEP 2: 문제 유형 선택 ── */}
        {step === "problem" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">문제 유형 선택</h2>
            <div className="grid grid-cols-2 gap-3">
              {PROBLEM_TYPES.map((pt) => {
                const Icon = pt.icon;
                const isSelected = problemType === pt.id;
                return (
                  <button
                    key={pt.id}
                    onClick={() => setProblemType(pt.id)}
                    className={`relative flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? `${pt.borderColor} ${pt.bgColor} shadow-md`
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-xl ${isSelected ? pt.bgColor : "bg-gray-100"} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${isSelected ? pt.color : "text-gray-400"}`} />
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? pt.color : "text-gray-600"}`}>{pt.label}</span>
                  </button>
                );
              })}
            </div>

            {problemType === "electrical" && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>전기 관련 문제는 안전 위험이 있습니다. 직접 수리를 시도하지 마시고 반드시 전문가에게 문의하세요.</p>
              </div>
            )}
            {problemType === "boiler" && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex gap-2 text-sm text-orange-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>가스 보일러 문제는 가스 누출 위험이 있을 수 있습니다. 냄새가 심하면 창문을 열고 가스 밸브를 잠그세요.</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">증상 설명 (선택)</label>
              <Textarea
                placeholder="언제부터, 어떤 상황에서 문제가 발생했는지 자세히 설명해 주세요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("info")} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1.5" />이전
              </Button>
              <Button disabled={!canProceedFromProblem()} onClick={() => setStep("checklist")} className="flex-1">
                다음 <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: 사진업로드 + 체크리스트 ── */}
        {step === "checklist" && (
          <div className="space-y-5">
            <h2 className="font-semibold text-gray-800">
              {problemInfo?.label} 관련 체크리스트
            </h2>

            {/* Checklist */}
            <div className="bg-white border rounded-xl divide-y overflow-hidden">
              {checklist.map((question) => (
                <button
                  key={question}
                  onClick={() => toggleChecklist(question)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
                    checklistAnswers[question] ? "bg-blue-600 border-blue-600" : "border-gray-300"
                  }`}>
                    {checklistAnswers[question] && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-sm text-gray-700">{question}</span>
                </button>
              ))}
            </div>

            {/* Photo/video upload */}
            <div className="bg-white border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Camera className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-sm text-gray-800">사진 / 영상 업로드</span>
              </div>
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5 leading-relaxed">
                정확한 진단을 위해 <strong>전체 사진 1장</strong>, <strong>문제 부위 근접 사진 2~3장</strong>, <strong>작동 중 영상 1개</strong>를 업로드해주세요.
              </p>

              {uploadedFiles.length > 0 && (
                <div className="space-y-1.5">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-blue-50 rounded-lg p-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="truncate flex-1 text-blue-700">{f.name}</span>
                      <button
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => setUploadedFiles((prev) => prev.filter((_, j) => j !== i))}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                ) : (
                  <Upload className="w-5 h-5 text-gray-400" />
                )}
                <span className="text-sm text-gray-500">{uploading ? "업로드 중..." : "파일 선택 (사진, 영상)"}</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("problem")} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1.5" />이전
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createDiagnosis.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {createDiagnosis.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ClipboardCheck className="w-4 h-4 mr-2" />}
                진단 요청
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: 결과 ── */}
        {step === "result" && diagnosisResult && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800">진단 요청이 접수되었습니다</p>
                <p className="text-xs text-green-600">접수번호: {submittedId?.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700 leading-relaxed">
              {diagnosisResult.disclaimer}
            </div>

            <div className="bg-white border rounded-xl divide-y overflow-hidden">
              <div className="px-4 py-3.5">
                <p className="text-xs text-gray-400 mb-1">문제 유형</p>
                <p className="font-semibold text-gray-800">{diagnosisResult.label}</p>
              </div>
              <div className="px-4 py-3.5">
                <p className="text-xs text-gray-400 mb-1">예상 원인</p>
                <p className="text-sm text-gray-700 leading-relaxed">{diagnosisResult.possibleCauses}</p>
              </div>
              <div className="px-4 py-3.5">
                <p className="text-xs text-gray-400 mb-1">권장 조치</p>
                <p className="text-sm text-gray-700 leading-relaxed">{diagnosisResult.recommendedAction}</p>
              </div>
              <div className="px-4 py-3.5 flex gap-6">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">예상 비용</p>
                  <p className="font-semibold text-blue-600 text-sm">{(diagnosisResult as any).estimatedCost ?? "방문 후 산정"}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">긴급도</p>
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                    diagnosisResult.urgency?.includes("긴급") ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {diagnosisResult.urgency}
                  </span>
                </div>
              </div>
              {diagnosisResult.videoTitle && (
                <div className="px-4 py-3.5">
                  <p className="text-xs text-gray-400 mb-1">추천 영상</p>
                  <p className="text-sm font-medium text-purple-700">{diagnosisResult.videoTitle}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={() => navigate("/book")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <PhoneCall className="w-4 h-4 mr-2" />
                기사 방문 요청하기
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("info");
                  setCustomerName(""); setPhone(""); setAddress(""); setPreferredDate(""); setIsUrgent("no");
                  setProblemType(null); setDescription("");
                  setChecklistAnswers({}); setUploadedFiles([]);
                  setDiagnosisResult(null); setSubmittedId(null);
                }}
              >
                새 점검 요청하기
              </Button>
              <Button variant="ghost" onClick={() => navigate("/")}>
                홈으로 돌아가기
              </Button>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
