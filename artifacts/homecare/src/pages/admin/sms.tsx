import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useListSmsNotifications, useMarkSmsSent } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Bell, Check, Copy, MessageSquare, Filter, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const TYPE_LABELS: Record<string, string> = {
  board_reply: "게시판 답변",
  order_created: "주문 접수",
  order_assigned: "파트너 배정",
  order_status_changed: "주문 상태 변경",
  project_status_changed: "프로젝트 상태",
  partner_approved: "파트너 승인",
  partner_rejected: "파트너 반려",
  contract_pending: "계약서 동의 요청",
  general: "일반",
};

const TYPE_COLORS: Record<string, string> = {
  board_reply: "bg-blue-50 text-blue-700",
  order_created: "bg-green-50 text-green-700",
  order_assigned: "bg-purple-50 text-purple-700",
  order_status_changed: "bg-yellow-50 text-yellow-700",
  project_status_changed: "bg-orange-50 text-orange-700",
  partner_approved: "bg-emerald-50 text-emerald-700",
  partner_rejected: "bg-red-50 text-red-700",
  contract_pending: "bg-indigo-50 text-indigo-700",
  general: "bg-gray-100 text-gray-600",
};

export default function AdminSmsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterSent, setFilterSent] = useState<"all" | "pending" | "sent">("pending");

  const queryParams: Record<string, any> = {};
  if (filterSent === "pending") queryParams.isSent = false;
  if (filterSent === "sent") queryParams.isSent = true;

  const { data: notifications, isLoading, refetch } = useListSmsNotifications(queryParams, {
    query: { refetchOnMount: true },
  });

  const markSent = useMarkSmsSent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).includes("listSmsNotifications") });
        toast({ title: "발송 완료로 표시했습니다" });
      },
      onError: () => toast({ title: "처리에 실패했습니다", variant: "destructive" }),
    },
  });

  function copyMessage(text: string) {
    navigator.clipboard.writeText(text);
    toast({ title: "메시지가 복사되었습니다" });
  }

  const pendingCount = notifications?.filter((n) => !n.isSent).length ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">문자 알림 관리</h1>
              <p className="text-sm text-gray-500">
                고객·파트너·관리자 간 문자 알림을 관리합니다
                {pendingCount > 0 && filterSent !== "sent" && (
                  <span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    미발송 {pendingCount}건
                  </span>
                )}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {[
            { value: "pending", label: "미발송" },
            { value: "sent", label: "발송 완료" },
            { value: "all", label: "전체" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterSent(f.value as any)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterSent === f.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !notifications?.length ? (
          <div className="text-center py-16 text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{filterSent === "pending" ? "미발송 알림이 없습니다" : "알림 내역이 없습니다"}</p>
            {filterSent === "pending" && (
              <p className="text-sm mt-2">주문, 게시판 답변 등 이벤트 발생 시 자동으로 등록됩니다</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`bg-white border rounded-xl shadow-sm overflow-hidden ${n.isSent ? "opacity-60" : ""}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[n.type] ?? "bg-gray-100 text-gray-600"}`}>
                          {TYPE_LABELS[n.type] ?? n.type}
                        </span>
                        {n.isSent ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" />발송 완료
                          </span>
                        ) : (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            미발송
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-gray-700">{n.recipientName || "수신자"}</span>
                          <span className="text-sm text-gray-500 ml-2">{n.recipientPhone}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap border">
                        {n.messageContent}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(n.createdAt).toLocaleString("ko-KR")}
                        {n.sentAt && ` · 발송: ${new Date(n.sentAt).toLocaleString("ko-KR")}`}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyMessage(n.messageContent)}
                        className="flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        복사
                      </Button>
                      {!n.isSent && (
                        <Button
                          size="sm"
                          onClick={() => markSent.mutateAsync({ id: n.id })}
                          className="flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          발송 완료
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
