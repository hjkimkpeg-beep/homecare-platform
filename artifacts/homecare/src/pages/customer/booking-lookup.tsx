import { useState } from "react";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { translateOrderStatus } from "@/lib/format";
import {
  Search, Loader2, CalendarDays, MapPin, FileText,
  ChevronRight, CheckCircle2, AlertCircle, Clock, Edit2, X
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type OrderDetail = {
  id: string;
  orderNumber: string;
  packageName: string;
  status: string;
  totalPrice: number;
  roadAddress: string;
  detailAddress: string;
  scheduledDate: string;
  requestNote: string | null;
  createdAt: string;
};

const MODIFIABLE_STATUSES = ["pending_assignment", "assigned"];

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  if (status === "cancelled") return <X className="w-5 h-5 text-red-500" />;
  return <Clock className="w-5 h-5 text-blue-500" />;
}

export default function BookingLookup() {
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editRoad, setEditRoad] = useState("");
  const [editDetail, setEditDetail] = useState("");
  const [editNote, setEditNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !orderNumber.trim()) {
      toast({ title: "전화번호와 예약번호를 모두 입력해주세요.", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    setOrder(null);
    setNotFound(false);
    try {
      const res = await fetch(
        `${BASE}/api/orders/lookup?phone=${encodeURIComponent(phone.trim())}&orderNumber=${encodeURIComponent(orderNumber.trim())}`,
        { credentials: "include" }
      );
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error();
      const data: OrderDetail = await res.json();
      setOrder(data);
    } catch {
      toast({ title: "조회 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const openEdit = () => {
    if (!order) return;
    setEditDate(order.scheduledDate ? order.scheduledDate.slice(0, 16) : "");
    setEditRoad(order.roadAddress);
    setEditDetail(order.detailAddress);
    setEditNote(order.requestNote || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!order) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${BASE}/api/orders/${order.id}/modify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phone: phone.trim(),
          orderNumber: orderNumber.trim(),
          scheduledDate: editDate ? new Date(editDate).toISOString() : undefined,
          roadAddress: editRoad,
          detailAddress: editDetail,
          requestNote: editNote,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: err.error || "수정에 실패했습니다.", variant: "destructive" });
        return;
      }
      const updated: OrderDetail = await res.json();
      setOrder(updated);
      setIsEditing(false);
      toast({ title: "예약이 성공적으로 수정되었습니다." });
    } catch {
      toast({ title: "수정 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const canModify = order && MODIFIABLE_STATUSES.includes(order.status);

  return (
    <CustomerLayout>
      <div className="min-h-[calc(100dvh-56px)] bg-gray-50 px-4 py-10">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
              <Search className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">예약 현황 조회</h1>
            <p className="text-gray-500 text-sm mt-2">
              예약 시 등록한 전화번호와 예약번호로 조회하세요
            </p>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">전화번호</label>
              <Input
                placeholder="01012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="input-phone"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">예약번호</label>
              <Input
                placeholder="HC20240424XXXX"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                data-testid="input-order-number"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-xl"
              disabled={isSearching}
              data-testid="button-search"
            >
              {isSearching
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 조회 중...</>
                : <><Search className="w-4 h-4 mr-2" /> 예약 조회</>
              }
            </Button>
          </form>

          {/* Not found */}
          {notFound && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-red-700 text-sm">입력하신 정보와 일치하는 예약을 찾을 수 없습니다.</p>
            </div>
          )}

          {/* Order detail */}
          {order && !isEditing && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">예약번호 {order.orderNumber}</p>
                  <h2 className="text-lg font-bold text-gray-900">{order.packageName}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon status={order.status} />
                  <span className={`text-sm font-semibold ${
                    order.status === "completed" ? "text-green-600" :
                    order.status === "cancelled" ? "text-red-600" : "text-blue-600"
                  }`}>
                    {translateOrderStatus(order.status)}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-100 text-sm">
                <div className="flex items-start gap-3 py-3">
                  <CalendarDays className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">예약 일시</p>
                    <p className="font-medium text-gray-800">
                      {new Date(order.scheduledDate).toLocaleString("ko-KR", {
                        year: "numeric", month: "long", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">서비스 주소</p>
                    <p className="font-medium text-gray-800">{order.roadAddress}</p>
                    {order.detailAddress && <p className="text-gray-500">{order.detailAddress}</p>}
                  </div>
                </div>
                {order.requestNote && (
                  <div className="flex items-start gap-3 py-3">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">요청사항</p>
                      <p className="text-gray-700">{order.requestNote}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-500">결제 금액</span>
                  <span className="font-extrabold text-gray-900 text-base">
                    {order.totalPrice.toLocaleString("ko-KR")}원
                  </span>
                </div>
              </div>

              {canModify && (
                <Button
                  onClick={openEdit}
                  className="w-full bg-gray-900 hover:bg-gray-700 text-white font-semibold py-2.5 rounded-xl"
                >
                  <Edit2 className="w-4 h-4 mr-2" /> 예약 수정
                </Button>
              )}
              {!canModify && order.status !== "cancelled" && (
                <p className="text-center text-xs text-gray-400">
                  서비스가 진행 중이거나 완료되어 수정이 불가합니다.
                </p>
              )}
            </div>
          )}

          {/* Edit form */}
          {order && isEditing && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="text-base font-bold text-gray-900 mb-2">예약 수정</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">예약 일시</label>
                <Input
                  type="datetime-local"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">도로명 주소</label>
                <Input
                  value={editRoad}
                  onChange={(e) => setEditRoad(e.target.value)}
                  placeholder="도로명 주소"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">상세 주소</label>
                <Input
                  value={editDetail}
                  onChange={(e) => setEditDetail(e.target.value)}
                  placeholder="동, 호수 등"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">요청사항</label>
                <Textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="추가 요청사항을 입력해주세요"
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  취소
                </Button>
                <Button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                  onClick={handleSave}
                  disabled={isSaving}
                  data-testid="button-save"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "저장"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}
