import { useState } from "react";
import { useAdminListPartners, useAdminApprovePartner, getAdminListPartnersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { translatePartnerApprovalStatus } from "@/lib/format";
import { Loader2, CheckCircle2, XCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const TABS = [
  { value: "all", label: "전체" },
  { value: "pending", label: "승인대기" },
  { value: "approved", label: "승인됨" },
  { value: "suspended", label: "정지됨" },
];

export default function AdminPartners() {
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useAdminListPartners({
    approvalStatus: activeTab === "all" ? undefined : activeTab,
  });

  const approveMutation = useAdminApprovePartner();

  const handleStatusChange = (id: string, status: "approved" | "rejected" | "suspended") => {
    approveMutation.mutate(
      { id, data: { approvalStatus: status } },
      {
        onSuccess: () => {
          toast({ title: `파트너 상태가 ${translatePartnerApprovalStatus(status)}으로 변경되었습니다.` });
          queryClient.invalidateQueries({ queryKey: getAdminListPartnersQueryKey({ approvalStatus: activeTab === "all" ? undefined : activeTab }) });
        },
        onError: () => {
          toast({ title: "상태 변경 실패", variant: "destructive" });
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    if (status === 'approved') return "bg-green-100 text-green-800";
    if (status === 'pending') return "bg-yellow-100 text-yellow-800";
    if (status === 'rejected' || status === 'suspended') return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">파트너 관리</h1>
            <p className="text-gray-500 mt-1">서비스를 제공하는 매니저(파트너)를 관리합니다.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="이름, 연락처 검색..." className="pl-9" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto pb-2 border-b no-scrollbar">
          <div className="flex gap-2">
            {TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
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
                  <th className="px-5 py-4 font-medium">이름</th>
                  <th className="px-5 py-4 font-medium">연락처</th>
                  <th className="px-5 py-4 font-medium">유형</th>
                  <th className="px-5 py-4 font-medium">등급</th>
                  <th className="px-5 py-4 font-medium">상태</th>
                  <th className="px-5 py-4 font-medium">가입일</th>
                  <th className="px-5 py-4 font-medium text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-20 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    </td>
                  </tr>
                ) : !data || data.partners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-20 text-center text-gray-500">
                      등록된 파트너가 없습니다.
                    </td>
                  </tr>
                ) : (
                  data.partners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-900">{partner.name}</td>
                      <td className="px-5 py-4 text-gray-600">{partner.phone}</td>
                      <td className="px-5 py-4 text-gray-600">{partner.businessType === 'business' ? '사업자' : '개인'}</td>
                      <td className="px-5 py-4 font-medium text-primary">{partner.grade}</td>
                      <td className="px-5 py-4">
                        <Badge className={getStatusColor(partner.approvalStatus)} variant="outline">
                          {translatePartnerApprovalStatus(partner.approvalStatus)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {new Date(partner.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {partner.approvalStatus === "pending" && (
                            <>
                              <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleStatusChange(partner.id, "approved")} data-testid={`btn-approve-${partner.id}`}>
                                <CheckCircle2 className="w-4 h-4 mr-1" /> 승인
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusChange(partner.id, "rejected")} data-testid={`btn-reject-${partner.id}`}>
                                <XCircle className="w-4 h-4 mr-1" /> 거절
                              </Button>
                            </>
                          )}
                          {partner.approvalStatus === "approved" && (
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusChange(partner.id, "suspended")} data-testid={`btn-suspend-${partner.id}`}>
                              정지
                            </Button>
                          )}
                          {partner.approvalStatus === "suspended" && (
                            <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleStatusChange(partner.id, "approved")} data-testid={`btn-unsuspend-${partner.id}`}>
                              정지 해제
                            </Button>
                          )}
                        </div>
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
