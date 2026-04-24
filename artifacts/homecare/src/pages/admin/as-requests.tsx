import { useAdminListAsRequests } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Link } from "wouter";
import { translateAsRequestStatus } from "@/lib/format";
import { Loader2, Search, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function AdminAsRequests() {
  const { data: requests, isLoading } = useAdminListAsRequests({});

  const getStatusColor = (status: string) => {
    if (status === 'completed') return "bg-green-100 text-green-800";
    if (status === 'pending') return "bg-yellow-100 text-yellow-800";
    if (status === 'in_progress') return "bg-blue-100 text-blue-800";
    if (status === 'assigned') return "bg-indigo-100 text-indigo-800";
    if (status === 'rejected') return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">A/S 요청 관리</h1>
            <p className="text-gray-500 mt-1">고객의 A/S 요청을 관리합니다.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="주문번호, 고객명 검색..." className="pl-9" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 border-b">
                <tr>
                  <th className="px-5 py-4 font-medium">요청일시</th>
                  <th className="px-5 py-4 font-medium">상태</th>
                  <th className="px-5 py-4 font-medium">원주문번호</th>
                  <th className="px-5 py-4 font-medium">요청사유</th>
                  <th className="px-5 py-4 font-medium text-right">바로가기</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-20 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    </td>
                  </tr>
                ) : !requests || requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-20 text-center text-gray-500">
                      A/S 요청이 없습니다.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-gray-500">
                        {new Date(req.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-4">
                        <Badge className={getStatusColor(req.status)} variant="outline">
                          {translateAsRequestStatus(req.status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 font-medium text-primary">
                        <Link href={`/admin/orders/${req.orderId}`}>
                          <span className="hover:underline cursor-pointer flex items-center gap-1">
                            주문보기 <ExternalLink className="w-3 h-3" />
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-gray-900 max-w-[300px] truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {/* More management actions could go here */}
                      </td>
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
