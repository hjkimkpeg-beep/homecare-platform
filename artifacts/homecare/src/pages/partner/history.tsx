import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { LogOut, Package, CheckCircle, MapPin, Calendar, Inbox } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchHistory() {
  const res = await fetch(`${BASE}/api/partner/history`, { credentials: "include" });
  if (!res.ok) throw new Error("작업 이력을 불러오지 못했습니다");
  return res.json();
}

const ASSIGNMENT_STATUS_LABEL: Record<string, { label: string; className: string }> = {
  completed: { label: "완료", className: "bg-green-100 text-green-700" },
  rejected: { label: "거절", className: "bg-red-100 text-red-600" },
  cancelled: { label: "취소", className: "bg-gray-100 text-gray-500" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
}

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR") + "원";
}

export default function PartnerHistory() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["partner-history"],
    queryFn: fetchHistory,
  });

  const completed = history.filter((h: any) => h.assignmentStatus === "completed");
  const totalEarnings = completed.reduce((sum: number, h: any) => sum + (h.totalPrice ?? 0), 0);

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
        {completed.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-sm text-gray-500">전체 완료 작업</p>
            <p className="text-2xl font-bold text-primary">{completed.length}건</p>
            <p className="text-sm text-gray-500 mt-1">
              누적 수익: <span className="font-semibold text-gray-700">{formatPrice(totalEarnings)}</span>
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16 text-gray-400">불러오는 중...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Inbox className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>작업 이력이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item: any) => {
              const statusInfo = ASSIGNMENT_STATUS_LABEL[item.assignmentStatus] ?? {
                label: item.assignmentStatus,
                className: "bg-gray-100 text-gray-500",
              };
              return (
                <div key={item.assignmentId} className="bg-white rounded-xl border p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1 ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                      <h3 className="font-semibold text-gray-900">{item.packageName}</h3>
                      <p className="text-xs text-gray-400">{item.orderNumber}</p>
                    </div>
                    {item.assignmentStatus === "completed" && (
                      <span className="text-base font-bold text-primary">{formatPrice(item.totalPrice)}</span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-gray-300" />
                      <span>{item.roadAddress}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-300" />
                      <span>{formatDate(item.scheduledDate)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t flex">
        <button
          className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-400"
          onClick={() => setLocation("/partner/jobs")}
        >
          <Package className="h-5 w-5" />
          <span className="text-xs">배차목록</span>
        </button>
        <button className="flex-1 py-3 flex flex-col items-center gap-1 text-primary border-t-2 border-primary">
          <CheckCircle className="h-5 w-5" />
          <span className="text-xs font-medium">작업이력</span>
        </button>
      </nav>
    </div>
  );
}
