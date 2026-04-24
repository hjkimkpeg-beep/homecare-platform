import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { 
  useAdminGetOrder, 
  getAdminGetOrderQueryKey, 
  useAdminUpdateOrderStatus, 
  useAdminListPartners,
  useAdminAssignOrder
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { formatCurrency, getOrderStatusColor, translateOrderStatus } from "@/lib/format";
import { Loader2, MapPin, Calendar, CheckCircle2, User, Phone, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const STATUS_OPTIONS = [
  "requested", "paid", "pending_assignment", "assigned", "en_route", 
  "arrived", "in_progress", "inspection_pending", "inspection_approved", 
  "completed", "cancelled", "as_requested"
];

export default function AdminOrderDetail() {
  const [, params] = useRoute("/admin/orders/:id");
  const id = params?.id || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");

  const { data: order, isLoading } = useAdminGetOrder(id, {
    query: { enabled: !!id, queryKey: getAdminGetOrderQueryKey(id) }
  });

  const { data: partnersResponse } = useAdminListPartners({ approvalStatus: "approved" });

  const updateStatusMutation = useAdminUpdateOrderStatus();
  const assignOrderMutation = useAdminAssignOrder();

  useEffect(() => {
    if (order) {
      setNewStatus(order.status);
    }
  }, [order]);

  const handleUpdateStatus = () => {
    if (!newStatus || newStatus === order?.status) return;

    updateStatusMutation.mutate(
      { id, data: { status: newStatus, note: statusNote } },
      {
        onSuccess: () => {
          toast({ title: "상태가 변경되었습니다." });
          queryClient.invalidateQueries({ queryKey: getAdminGetOrderQueryKey(id) });
          setStatusNote("");
        },
        onError: () => {
          toast({ title: "상태 변경 실패", variant: "destructive" });
        }
      }
    );
  };

  const handleAssignPartner = () => {
    if (!selectedPartnerId) return;

    assignOrderMutation.mutate(
      { id, data: { partnerId: selectedPartnerId } },
      {
        onSuccess: () => {
          toast({ title: "매니저가 배정되었습니다." });
          queryClient.invalidateQueries({ queryKey: getAdminGetOrderQueryKey(id) });
        },
        onError: () => {
          toast({ title: "배정 실패", variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-gray-500">주문을 찾을 수 없습니다.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
              <Badge className={getOrderStatusColor(order.status)} variant="outline">
                {translateOrderStatus(order.status)}
              </Badge>
            </div>
            <p className="text-gray-500">접수일: {new Date(order.createdAt).toLocaleString('ko-KR')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content: Order Info & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Service Info */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b bg-gray-50/50">
                <h2 className="font-bold text-gray-900">서비스 정보</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">패키지명</p>
                    <p className="font-medium text-gray-900">{order.packageName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">결제금액</p>
                    <p className="font-bold text-primary">{formatCurrency(order.totalPrice)}</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">예약 일시</p>
                    <p className="font-medium text-gray-900">
                      {new Date(order.scheduledDate).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">서비스 주소</p>
                    <p className="font-medium text-gray-900">{order.roadAddress}</p>
                    <p className="text-gray-600 text-sm mt-0.5">{order.detailAddress}</p>
                  </div>
                </div>

                {order.requestNote && (
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-sm font-medium text-gray-700 mb-1">고객 요청사항</p>
                    <p className="text-sm text-gray-600">{order.requestNote}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status Timeline logs */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b bg-gray-50/50">
                <h2 className="font-bold text-gray-900">상태 변경 이력</h2>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  {order.statusLogs.map((log, idx) => (
                    <div key={log.id} className="flex gap-4 relative">
                      {idx !== order.statusLogs.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gray-200 -z-10"></div>
                      )}
                      <div className="mt-1">
                        <CheckCircle2 className="w-6 h-6 text-gray-400 bg-white" />
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{translateOrderStatus(log.status)}</span>
                          <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString('ko-KR')}</span>
                        </div>
                        {log.note && <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1">{log.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Customer, Assignment & Controls */}
          <div className="space-y-6">
            
            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b bg-gray-50/50">
                <h2 className="font-bold text-gray-900">고객 정보</h2>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900">{order.customerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{order.customerPhone}</span>
                </div>
              </div>
            </div>

            {/* Assignment Info or Action */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b bg-gray-50/50">
                <h2 className="font-bold text-gray-900">매니저 배정</h2>
              </div>
              <div className="p-5">
                {order.assignment ? (
                  <div className="space-y-3">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mb-2">배정 완료</Badge>
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-primary" />
                      <span className="font-bold text-gray-900">{order.assignment.partnerName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">{order.assignment.partnerPhone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-500">배정일: {new Date(order.assignment.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 mb-2">아직 매니저가 배정되지 않았습니다.</p>
                    <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                      <SelectTrigger data-testid="select-partner">
                        <SelectValue placeholder="매니저 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {partnersResponse?.partners.map(partner => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name} ({partner.phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      className="w-full mt-2" 
                      onClick={handleAssignPartner}
                      disabled={!selectedPartnerId || assignOrderMutation.isPending}
                      data-testid="btn-assign-partner"
                    >
                      {assignOrderMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      배정하기
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Manual Status Update */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b bg-gray-50/50">
                <h2 className="font-bold text-gray-900">상태 수동 변경</h2>
              </div>
              <div className="p-5 space-y-3">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status} value={status}>
                        {translateOrderStatus(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Textarea 
                  placeholder="변경 사유 메모 (선택)" 
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="resize-none h-20 text-sm"
                  data-testid="input-status-note"
                />
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleUpdateStatus}
                  disabled={newStatus === order.status || updateStatusMutation.isPending}
                  data-testid="btn-update-status"
                >
                  {updateStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  상태 업데이트
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
