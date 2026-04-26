import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useListDiagnosisRequests, useUpdateDiagnosisStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListDiagnosisRequestsQueryKey } from "@workspace/api-client-react";
import {
  Activity, Droplets, Wind, Zap, Flame, AlertCircle,
  ChevronDown, ChevronRight, Loader2, Calendar, Phone,
  MapPin, AlertTriangle, ClipboardList, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const PROBLEM_LABELS: Record<string, string> = {
  leak: "누수",
  drain: "배수 막힘",
  boiler: "보일러 / 온수",
  aircon: "에어컨 / 환기",
  electrical: "전기 / 차단기",
  other: "기타",
};

const PROBLEM_ICONS: Record<string, typeof Droplets> = {
  leak: Droplets,
  drain: Activity,
  boiler: Flame,
  aircon: Wind,
  electrical: Zap,
  other: AlertCircle,
};

const PROBLEM_COLORS: Record<string, string> = {
  leak: "text-blue-600 bg-blue-50",
  drain: "text-green-600 bg-green-50",
  boiler: "text-orange-600 bg-orange-50",
  aircon: "text-cyan-600 bg-cyan-50",
  electrical: "text-yellow-600 bg-yellow-50",
  other: "text-gray-600 bg-gray-50",
};

const STATUS_OPTIONS = [
  { value: "received", label: "접수됨", color: "bg-blue-100 text-blue-700" },
  { value: "reviewing", label: "검토 중", color: "bg-yellow-100 text-yellow-700" },
  { value: "visit_scheduled", label: "방문 예약 완료", color: "bg-purple-100 text-purple-700" },
  { value: "completed", label: "수리 완료", color: "bg-green-100 text-green-700" },
  { value: "cancelled", label: "취소", color: "bg-gray-100 text-gray-500" },
];

const STATUS_FILTERS = [
  { value: "", label: "전체" },
  ...STATUS_OPTIONS,
];

const PROBLEM_FILTERS = [
  { value: "", label: "전체" },
  { value: "leak", label: "누수" },
  { value: "drain", label: "배수" },
  { value: "boiler", label: "보일러" },
  { value: "aircon", label: "에어컨" },
  { value: "electrical", label: "전기" },
  { value: "other", label: "기타" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

interface DiagnosisResult {
  label: string;
  possibleCauses: string;
  recommendedAction: string;
  urgency: string;
  estimatedCost?: string;
  videoTitle?: string;
  disclaimer: string;
}

function DiagnosisCard({ req }: { req: any }) {
  const [expanded, setExpanded] = useState(false);
  const [changing, setChanging] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateStatus = useUpdateDiagnosisStatus();

  const ProblemIcon = PROBLEM_ICONS[req.problemType] ?? AlertCircle;
  const problemColor = PROBLEM_COLORS[req.problemType] ?? "text-gray-600 bg-gray-50";
  const statusOption = STATUS_OPTIONS.find((s) => s.value === req.status);
  const result = req.diagnosisResult as DiagnosisResult | null;
  const checklist = req.checklistAnswers as Record<string, boolean> | null;
  const files = req.uploadedFiles as { name: string; url: string; type: string }[] | null;

  async function handleStatusChange(newStatus: string) {
    setChanging(true);
    try {
      await updateStatus.mutateAsync({ id: req.id, data: { status: newStatus as any } });
      await queryClient.invalidateQueries({ queryKey: getListDiagnosisRequestsQueryKey() });
      toast({ title: "상태가 업데이트되었습니다" });
    } catch {
      toast({ title: "업데이트 실패", variant: "destructive" });
    } finally {
      setChanging(false); }
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      {/* Card header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${problemColor}`}>
          <ProblemIcon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{req.customerName}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusOption?.color ?? "bg-gray-100 text-gray-500"}`}>
              {statusOption?.label ?? req.status}
            </span>
            {req.isUrgent === "yes" && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" />긴급
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            <span>{PROBLEM_LABELS[req.problemType] ?? req.problemType}</span>
            <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{req.phone}</span>
            <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{formatDate(req.createdAt)}</span>
          </div>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t bg-gray-50 px-4 py-4 space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400">주소</p>
              <p className="text-gray-700 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" />{req.address}</p>
            </div>
            {req.preferredDate && (
              <div>
                <p className="text-xs text-gray-400">희망 방문일</p>
                <p className="text-gray-700">{req.preferredDate}</p>
              </div>
            )}
            {req.estimatedCost && (
              <div>
                <p className="text-xs text-gray-400">예상 비용</p>
                <p className="font-semibold text-blue-600">{req.estimatedCost}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {req.description && (
            <div>
              <p className="text-xs text-gray-400 mb-1">고객 설명</p>
              <p className="text-sm text-gray-700 bg-white rounded-lg p-2.5 border">{req.description}</p>
            </div>
          )}

          {/* Checklist answers */}
          {checklist && Object.keys(checklist).length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">체크리스트 답변</p>
              <div className="space-y-1">
                {Object.entries(checklist).map(([q, a]) => (
                  <div key={q} className="flex items-center gap-2 text-sm">
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${a ? "bg-blue-600" : "bg-gray-200"}`}>
                      {a && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className={a ? "text-gray-800" : "text-gray-400"}>{q}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uploaded files */}
          {files && files.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">업로드 파일</p>
              <div className="flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <a
                    key={i}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border rounded-lg text-xs text-blue-600 hover:bg-blue-50"
                  >
                    {f.type?.startsWith("video") ? "🎬" : "🖼️"} {f.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Diagnosis result */}
          {result && (
            <div className="bg-white border rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">1차 진단 결과</p>
              <div className="space-y-1.5 text-sm">
                <p><span className="text-gray-400">예상 원인: </span>{result.possibleCauses}</p>
                <p><span className="text-gray-400">권장 조치: </span>{result.recommendedAction}</p>
                {result.urgency && (
                  <p><span className="text-gray-400">긴급도: </span>
                    <span className={`font-medium ${result.urgency.includes("긴급") ? "text-red-600" : "text-gray-700"}`}>
                      {result.urgency}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Status change */}
          <div>
            <p className="text-xs text-gray-400 mb-2">처리 상태 변경</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  disabled={req.status === opt.value || changing}
                  onClick={() => handleStatusChange(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    req.status === opt.value
                      ? `${opt.color} border-transparent`
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"
                  } disabled:opacity-60`}
                >
                  {changing && req.status !== opt.value ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDiagnosisPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [problemFilter, setProblemFilter] = useState("");

  const { data: requests, isLoading } = useListDiagnosisRequests(
    statusFilter || problemFilter ? { status: statusFilter || undefined, problemType: problemFilter || undefined } : {},
  );

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">원격 점검 접수 목록</h1>
            <p className="text-sm text-gray-500">고객이 제출한 원격 점검 요청을 검토합니다</p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                  statusFilter === f.value
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {PROBLEM_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setProblemFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                  problemFilter === f.value
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !requests || requests.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>접수된 원격 점검 요청이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{requests.length}건</p>
            {requests.map((r) => <DiagnosisCard key={r.id} req={r} />)}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
