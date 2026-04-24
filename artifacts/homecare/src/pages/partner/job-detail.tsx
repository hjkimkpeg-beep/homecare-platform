import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Calendar,
  ChevronLeft,
  Truck,
  Home,
  Wrench,
  ClipboardCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchJob(orderId: string) {
  const res = await fetch(`${BASE}/api/partner/jobs/${orderId}`, { credentials: "include" });
  if (!res.ok) throw new Error("작업 정보를 불러오지 못했습니다");
  return res.json();
}

async function advanceStatus(orderId: string) {
  const res = await fetch(`${BASE}/api/partner/orders/${orderId}/status`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("상태 변경에 실패했습니다");
  return res.json();
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_assignment: "배정대기",
  assigned: "배정완료",
  en_route: "이동중",
  arrived: "현장도착",
  in_progress: "작업중",
  inspection_pending: "검수대기",
  inspection_approved: "검수완료",
  completed: "완료",
};

const STATUS_STEPS = [
  { key: "assigned", label: "배정완료", icon: CheckCircle2 },
  { key: "en_route", label: "이동중", icon: Truck },
  { key: "arrived", label: "현장도착", icon: Home },
  { key: "in_progress", label: "작업중", icon: Wrench },
  { key: "inspection_pending", label: "검수요청", icon: ClipboardCheck },
];

const NEXT_ACTION_LABEL: Record<string, string> = {
  assigned: "이동 시작",
  en_route: "현장 도착",
  arrived: "작업 시작",
  in_progress: "검수 요청",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR") + "원";
}

export default function PartnerJobDetail() {
  const params = useParams<{ orderId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: job, isLoading, error } = useQuery({
    queryKey: ["partner-job", params.orderId],
    queryFn: () => fetchJob(params.orderId),
  });

  const advanceMutation = useMutation({
    mutationFn: () => advanceStatus(params.orderId),
    onSuccess: (data) => {
      toast({ title: `${ORDER_STATUS_LABEL[data.status] ?? data.status}(으)로 변경되었습니다` });
      queryClient.invalidateQueries({ queryKey: ["partner-job", params.orderId] });
      queryClient.invalidateQueries({ queryKey: ["partner-jobs"] });
    },
    onError: () => {
      toast({ title: "상태 변경 실패", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        불러오는 중...
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        작업 정보를 찾을 수 없습니다
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === job.orderStatus);
  const nextActionLabel = NEXT_ACTION_LABEL[job.orderStatus];
  const canAdvance = !!nextActionLabel && job.assignmentStatus === "accepted";

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col max-w-md mx-auto">
      <header className="bg-white border-b px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => setLocation("/partner/jobs")} className="text-gray-600">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-lg font-bold">작업 상세</h1>
          <p className="text-xs text-gray-400">{job.orderNumber}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{job.packageName}</h2>
              <span className="inline-block text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1">
                {ORDER_STATUS_LABEL[job.orderStatus] ?? job.orderStatus}
              </span>
            </div>
            <span className="text-xl font-bold text-primary">{formatPrice(job.totalPrice)}</span>
          </div>

          <div className="space-y-2 text-sm text-gray-600 border-t pt-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-medium text-gray-800">{job.roadAddress}</p>
                <p className="text-gray-500">{job.detailAddress}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{formatDate(job.scheduledDate)}</span>
            </div>
            {job.requestNote && (
              <div className="bg-gray-50 rounded-lg p-3 mt-2">
                <p className="text-xs text-gray-400 mb-1">고객 요청사항</p>
                <p className="text-gray-700">{job.requestNote}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">작업 진행 단계</h3>
          <div className="relative">
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />
            <div className="space-y-4">
              {STATUS_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const done = idx <= currentStepIdx;
                const current = idx === currentStepIdx;
                return (
                  <div key={step.key} className="flex items-center gap-3 relative">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                        done
                          ? current
                            ? "bg-primary text-white shadow-md"
                            : "bg-primary/20 text-primary"
                          : "bg-gray-100 text-gray-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        current ? "text-primary" : done ? "text-gray-700" : "text-gray-300"
                      }`}
                    >
                      {step.label}
                    </span>
                    {current && (
                      <span className="ml-auto text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                        현재
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {job.statusLogs && job.statusLogs.length > 0 && (
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">상태 이력</h3>
            <div className="space-y-2">
              {job.statusLogs.map((log: any, i: number) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <Clock className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-700">{ORDER_STATUS_LABEL[log.status] ?? log.status}</p>
                    {log.note && <p className="text-gray-400 text-xs">{log.note}</p>}
                  </div>
                  <span className="ml-auto text-xs text-gray-300 flex-shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {canAdvance && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t p-4">
          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={() => advanceMutation.mutate()}
            disabled={advanceMutation.isPending}
          >
            {advanceMutation.isPending ? "처리 중..." : nextActionLabel}
          </Button>
        </div>
      )}

      {!canAdvance && job.orderStatus === "inspection_pending" && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t p-4">
          <div className="text-center text-sm text-gray-500 py-2">
            관리자 검수 대기 중입니다
          </div>
        </div>
      )}
    </div>
  );
}
