import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Calendar,
  Package,
  LogOut,
  ChevronRight,
  Inbox,
  CheckCircle,
  XCircle,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchPartnerJobs() {
  const res = await fetch(`${BASE}/api/partner/jobs`, { credentials: "include" });
  if (!res.ok) throw new Error("배차 목록을 불러오지 못했습니다");
  return res.json();
}

async function acceptJob(orderId: string) {
  const res = await fetch(`${BASE}/api/partner/jobs/${orderId}/accept`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("수락에 실패했습니다");
  return res.json();
}

async function rejectJob(orderId: string) {
  const res = await fetch(`${BASE}/api/partner/jobs/${orderId}/reject`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: "일정 불가" }),
  });
  if (!res.ok) throw new Error("거절에 실패했습니다");
  return res.json();
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_assignment: "배정대기",
  assigned: "배정완료",
  en_route: "이동중",
  arrived: "도착",
  in_progress: "작업중",
  inspection_pending: "검수대기",
  inspection_approved: "검수완료",
  completed: "완료",
  cancelled: "취소",
  as_requested: "A/S접수",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR") + "원";
}

export default function PartnerJobs() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["partner-jobs"],
    queryFn: fetchPartnerJobs,
    refetchInterval: 30000,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptJob,
    onSuccess: () => {
      toast({ title: "배차를 수락했습니다" });
      queryClient.invalidateQueries({ queryKey: ["partner-jobs"] });
    },
    onError: () => {
      toast({ title: "수락 실패", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectJob,
    onSuccess: () => {
      toast({ title: "배차를 거절했습니다" });
      queryClient.invalidateQueries({ queryKey: ["partner-jobs"] });
    },
    onError: () => {
      toast({ title: "거절 실패", variant: "destructive" });
    },
  });

  const pending = jobs.filter((j: any) => j.assignmentStatus === "pending");
  const accepted = jobs.filter((j: any) => j.assignmentStatus === "accepted");

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col max-w-md mx-auto">
      <header className="bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-primary">HomeCare 파트너</h1>
          <p className="text-xs text-gray-500">{user?.name} 기사님</p>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {isLoading ? (
          <div className="text-center py-16 text-gray-400">불러오는 중...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Inbox className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>배정된 작업이 없습니다</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 mb-2">
                  수락 대기 ({pending.length})
                </h2>
                <div className="space-y-3">
                  {pending.map((job: any) => (
                    <div key={job.assignmentId} className="bg-white rounded-xl border-2 border-yellow-300 p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="inline-block text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full mb-1">
                            신규 배차
                          </span>
                          <h3 className="font-semibold text-gray-900">{job.packageName}</h3>
                          <p className="text-sm text-gray-500">{job.orderNumber}</p>
                        </div>
                        <span className="text-base font-bold text-primary">{formatPrice(job.totalPrice)}</span>
                      </div>

                      <div className="space-y-1.5 mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span>{job.roadAddress} {job.detailAddress}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span>{formatDate(job.scheduledDate)}</span>
                        </div>
                        {job.requestNote && (
                          <div className="flex items-start gap-2">
                            <Package className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-500">{job.requestNote}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-primary"
                          size="sm"
                          onClick={() => acceptMutation.mutate(job.orderId)}
                          disabled={acceptMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          수락
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                          size="sm"
                          onClick={() => rejectMutation.mutate(job.orderId)}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          거절
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {accepted.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 mb-2">
                  진행중 ({accepted.length})
                </h2>
                <div className="space-y-3">
                  {accepted.map((job: any) => (
                    <button
                      key={job.assignmentId}
                      className="w-full text-left bg-white rounded-xl border p-4 shadow-sm hover:border-primary transition-colors"
                      onClick={() => setLocation(`/partner/jobs/${job.orderId}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {ORDER_STATUS_LABEL[job.orderStatus] ?? job.orderStatus}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900">{job.packageName}</h3>
                          <p className="text-xs text-gray-400 mb-2">{job.orderNumber}</p>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-gray-400" />
                              <span>{job.roadAddress}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                              <span>{formatDate(job.scheduledDate)}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-300 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t flex">
        <button className="flex-1 py-3 flex flex-col items-center gap-1 text-primary border-t-2 border-primary">
          <Package className="h-5 w-5" />
          <span className="text-xs font-medium">배차목록</span>
        </button>
        <button
          className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-400"
          onClick={() => setLocation("/partner/history")}
        >
          <CheckCircle className="h-5 w-5" />
          <span className="text-xs">작업이력</span>
        </button>
      </nav>
    </div>
  );
}
