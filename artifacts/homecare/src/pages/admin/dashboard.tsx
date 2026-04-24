import { useAdminDashboard } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Link } from "wouter";
import { formatCurrency, getOrderStatusColor, translateOrderStatus } from "@/lib/format";
import { Loader2, Users, ClipboardList, Clock, CheckCircle2, Wrench, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { data: dashboard, isLoading } = useAdminDashboard();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!dashboard) {
    return (
      <AdminLayout>
        <div className="text-center py-20 text-gray-500">데이터를 불러올 수 없습니다.</div>
      </AdminLayout>
    );
  }

  const statCards = [
    { label: "총 주문 (누적)", value: dashboard.totalOrders, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "배정 대기", value: dashboard.pendingAssignment, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "진행 중", value: dashboard.inProgress, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "금일 완료", value: dashboard.completedToday, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "A/S 요청", value: dashboard.asRequests, icon: Wrench, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-500 mt-1">플랫폼 현황을 한눈에 확인하세요.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">{stat.label}</span>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b flex justify-between items-center">
            <h2 className="font-bold text-lg text-gray-900">최근 주문 내역</h2>
            <Link href="/admin/orders">
              <span className="text-sm text-primary hover:underline cursor-pointer flex items-center">
                전체보기 <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">주문번호</th>
                  <th className="px-5 py-3 font-medium">패키지</th>
                  <th className="px-5 py-3 font-medium">예약일시</th>
                  <th className="px-5 py-3 font-medium">상태</th>
                  <th className="px-5 py-3 font-medium text-right">금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dashboard.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                      최근 주문 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  dashboard.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/admin/orders/${order.id}`}>
                      <td className="px-5 py-3 text-gray-500">{order.orderNumber}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{order.packageName}</td>
                      <td className="px-5 py-3 text-gray-500">
                        {new Date(order.scheduledDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3">
                        <Badge className={getOrderStatusColor(order.status)} variant="outline">
                          {translateOrderStatus(order.status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-medium">{formatCurrency(order.totalPrice)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
