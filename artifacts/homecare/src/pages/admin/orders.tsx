import { useState } from "react";
import { useAdminListOrders } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Link } from "wouter";
import { formatCurrency, getOrderStatusColor, translateOrderStatus } from "@/lib/format";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TABS = [
  { value: "all", label: "전체" },
  { value: "pending_assignment", label: "배정대기" },
  { value: "assigned", label: "배정완료" },
  { value: "in_progress", label: "작업중" },
  { value: "inspection_pending", label: "검수대기" },
  { value: "completed", label: "완료" },
  { value: "cancelled", label: "취소" },
];

export default function AdminOrders() {
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useAdminListOrders({
    status: activeTab === "all" ? undefined : activeTab,
    page,
    limit: 20
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">주문 관리</h1>
            <p className="text-gray-500 mt-1">모든 서비스 주문을 관리하고 상태를 변경합니다.</p>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="주문번호, 고객명 검색..." className="pl-9" />
            </div>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto pb-2 border-b no-scrollbar">
          <div className="flex gap-2">
            {TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => { setActiveTab(tab.value); setPage(1); }}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.value 
                    ? "bg-gray-900 text-white font-medium" 
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                data-testid={`tab-${tab.value}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 border-b">
                <tr>
                  <th className="px-5 py-4 font-medium">주문번호</th>
                  <th className="px-5 py-4 font-medium">상태</th>
                  <th className="px-5 py-4 font-medium">패키지명</th>
                  <th className="px-5 py-4 font-medium">예약일시</th>
                  <th className="px-5 py-4 font-medium">주소</th>
                  <th className="px-5 py-4 font-medium text-right">총 금액</th>
                  <th className="px-5 py-4 font-medium text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-20 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    </td>
                  </tr>
                ) : !data || data.orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-20 text-center text-gray-500">
                      해당하는 주문 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  data.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-gray-500">{order.orderNumber}</td>
                      <td className="px-5 py-4">
                        <Badge className={getOrderStatusColor(order.status)} variant="outline">
                          {translateOrderStatus(order.status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900">{order.packageName}</td>
                      <td className="px-5 py-4 text-gray-600">
                        {new Date(order.scheduledDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-4 text-gray-600 truncate max-w-[200px]">{order.roadAddress}</td>
                      <td className="px-5 py-4 text-right font-medium">{formatCurrency(order.totalPrice)}</td>
                      <td className="px-5 py-4 text-center">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="outline" size="sm" data-testid={`btn-manage-${order.id}`}>
                            상세보기
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.total > 0 && (
            <div className="p-4 border-t flex items-center justify-between">
              <span className="text-sm text-gray-500">
                총 {data.total}건 중 {(page - 1) * data.limit + 1}-{Math.min(page * data.limit, data.total)}건
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  이전
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page * data.limit >= data.total}
                  onClick={() => setPage(p => p + 1)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
