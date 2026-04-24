import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { translateOrderStatus } from "@/lib/format";
import {
  Search, Loader2, CalendarDays, MapPin, FileText,
  User, Phone, Package, ChevronRight, Filter
} from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type OrderResult = {
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
  customerName?: string;
  customerPhone?: string;
};

const STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "pending_assignment", label: "배정 대기" },
  { value: "assigned", label: "배정 완료" },
  { value: "in_progress", label: "진행 중" },
  { value: "inspection_pending", label: "검수 대기" },
  { value: "completed", label: "완료" },
  { value: "cancelled", label: "취소" },
];

function statusColor(s: string) {
  if (s === "completed")  return "bg-green-100 text-green-800";
  if (s === "cancelled")  return "bg-red-100 text-red-800";
  if (s === "in_progress") return "bg-blue-100 text-blue-800";
  if (s === "pending_assignment") return "bg-amber-100 text-amber-800";
  return "bg-gray-100 text-gray-800";
}

export default function AdminBookingLookup() {
  const { toast } = useToast();
  const [query, setQuery] = useState({ phone: "", orderNumber: "", status: "", dateFrom: "", dateTo: "" });
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<OrderResult[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (query.phone)       params.set("phone", query.phone.trim());
      if (query.orderNumber) params.set("orderNumber", query.orderNumber.trim());
      if (query.status)      params.set("status", query.status);
      if (query.dateFrom)    params.set("dateFrom", query.dateFrom);
      if (query.dateTo)      params.set("dateTo", query.dateTo);

      const res = await fetch(`${BASE}/api/admin/booking-lookup?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResults(data.orders);
    } catch {
      toast({ title: "조회 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">예약 현황 조회</h1>
          <p className="text-gray-500 mt-1">고객 전화번호, 예약번호, 날짜 범위로 예약을 검색합니다.</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                고객 전화번호
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="01012345678"
                  value={query.phone}
                  onChange={(e) => setQuery(q => ({ ...q, phone: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                예약번호
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="HC20240424XXXX"
                  value={query.orderNumber}
                  onChange={(e) => setQuery(q => ({ ...q, orderNumber: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                예약 상태
              </label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={query.status}
                onChange={(e) => setQuery(q => ({ ...q, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                예약일 (시작)
              </label>
              <Input
                type="date"
                value={query.dateFrom}
                onChange={(e) => setQuery(q => ({ ...q, dateFrom: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                예약일 (종료)
              </label>
              <Input
                type="date"
                value={query.dateTo}
                onChange={(e) => setQuery(q => ({ ...q, dateTo: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full bg-gray-900 hover:bg-gray-700 text-white"
                disabled={isSearching}
              >
                {isSearching
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 조회 중</>
                  : <><Search className="w-4 h-4 mr-2" /> 검색</>
                }
              </Button>
            </div>
          </div>
        </form>

        {/* Results */}
        {results !== null && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                검색 결과 <span className="text-blue-600">{results.length}건</span>
              </p>
            </div>

            {results.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>검색 결과가 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-gray-50 border-b text-gray-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">예약번호</th>
                      <th className="px-5 py-3 font-medium">서비스</th>
                      <th className="px-5 py-3 font-medium">고객</th>
                      <th className="px-5 py-3 font-medium">예약일시</th>
                      <th className="px-5 py-3 font-medium">주소</th>
                      <th className="px-5 py-3 font-medium">금액</th>
                      <th className="px-5 py-3 font-medium">상태</th>
                      <th className="px-5 py-3 font-medium text-right">상세</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-gray-600">{order.orderNumber}</td>
                        <td className="px-5 py-4 font-medium text-gray-900">{order.packageName}</td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{order.customerName || "-"}</p>
                            <p className="text-xs text-gray-400">{order.customerPhone || "-"}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {new Date(order.scheduledDate).toLocaleString("ko-KR", {
                            month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="px-5 py-4 text-gray-600 max-w-[180px] truncate">
                          {order.roadAddress}
                        </td>
                        <td className="px-5 py-4 font-bold text-gray-900">
                          {order.totalPrice.toLocaleString("ko-KR")}원
                        </td>
                        <td className="px-5 py-4">
                          <Badge className={statusColor(order.status)} variant="outline">
                            {translateOrderStatus(order.status)}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link href={`/admin/orders/${order.id}`}>
                            <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 ml-auto">
                              상세 <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
