import { useState } from "react";
import { useAdminListPartners, useAdminApprovePartner, getAdminListPartnersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { translatePartnerApprovalStatus } from "@/lib/format";
import {
  Loader2, CheckCircle2, XCircle, Search, X,
  MapPin, Briefcase, Award, Clock, Star, Phone, Mail, User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const TABS = [
  { value: "all",       label: "전체" },
  { value: "pending",   label: "승인대기" },
  { value: "approved",  label: "승인됨" },
  { value: "rejected",  label: "반려됨" },
  { value: "suspended", label: "정지됨" },
];

type Partner = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  businessType: string;
  grade: string;
  ratingAvg: number;
  ratingCount: number;
  approvalStatus: string;
  approvalNote?: string | null;
  serviceArea?: string | null;
  career?: string | null;
  certifications?: string | null;
  experienceYears?: number;
  createdAt: string;
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "approved"  ? "bg-green-100 text-green-800" :
    status === "pending"   ? "bg-amber-100 text-amber-800" :
    status === "rejected"  ? "bg-red-100 text-red-800" :
    status === "suspended" ? "bg-orange-100 text-orange-800" :
    "bg-gray-100 text-gray-800";
  return (
    <Badge className={cls} variant="outline">
      {translatePartnerApprovalStatus(status)}
    </Badge>
  );
}

function DetailModal({
  partner,
  onClose,
  onAction,
  isPending,
}: {
  partner: Partner;
  onClose: () => void;
  onAction: (status: "approved" | "rejected" | "suspended", note: string) => void;
  isPending: boolean;
}) {
  const [note, setNote] = useState(partner.approvalNote || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{partner.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={partner.approvalStatus} />
              <span className="text-xs text-gray-400">가입일 {new Date(partner.createdAt).toLocaleDateString("ko-KR")}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={Phone} label="전화번호" value={partner.phone} />
            <InfoRow icon={Mail} label="이메일" value={partner.email || "미입력"} />
            <InfoRow icon={User} label="사업자 유형" value={partner.businessType === "business" ? "사업자" : "개인"} />
            <InfoRow icon={Star} label="등급 / 평점" value={`${partner.grade} / ${partner.ratingAvg}점 (${partner.ratingCount}건)`} />
          </div>

          {/* Professional info */}
          <div className="space-y-4">
            <InfoBlock
              icon={MapPin}
              label="서비스 가능 지역"
              value={partner.serviceArea || "미입력"}
              color="text-blue-500"
            />
            <InfoBlock
              icon={Clock}
              label="경력 연수"
              value={partner.experienceYears !== undefined ? `${partner.experienceYears}년` : "미입력"}
              color="text-purple-500"
            />
            <InfoBlock
              icon={Briefcase}
              label="경력 사항"
              value={partner.career || "미입력"}
              color="text-emerald-500"
              multiline
            />
            <InfoBlock
              icon={Award}
              label="보유 자격증"
              value={partner.certifications || "미입력"}
              color="text-amber-500"
              multiline
            />
          </div>

          {/* Admin note */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">심사 메모 (내부용)</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="경력, 자격증, 지역 적합성 등 심사 의견을 입력하세요."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t flex flex-wrap gap-3 justify-end">
          {partner.approvalStatus === "pending" && (
            <>
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => onAction("rejected", note)}
                disabled={isPending}
                data-testid="btn-reject"
              >
                <XCircle className="w-4 h-4 mr-1.5" /> 반려
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onAction("approved", note)}
                disabled={isPending}
                data-testid="btn-approve"
              >
                {isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
                승인
              </Button>
            </>
          )}
          {partner.approvalStatus === "approved" && (
            <Button
              variant="outline"
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
              onClick={() => onAction("suspended", note)}
              disabled={isPending}
              data-testid="btn-suspend"
            >
              활동 정지
            </Button>
          )}
          {(partner.approvalStatus === "suspended" || partner.approvalStatus === "rejected") && (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onAction("approved", note)}
              disabled={isPending}
              data-testid="btn-reapprove"
            >
              {isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
              승인
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>닫기</Button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function InfoBlock({
  icon: Icon, label, value, color, multiline,
}: {
  icon: React.ElementType; label: string; value: string; color: string; multiline?: boolean;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-sm text-gray-800 ${multiline ? "whitespace-pre-wrap" : ""}`}>{value}</p>
    </div>
  );
}

export default function AdminPartners() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useAdminListPartners({
    approvalStatus: activeTab === "all" ? undefined : activeTab,
  });

  const approveMutation = useAdminApprovePartner();

  const handleAction = (id: string, status: "approved" | "rejected" | "suspended", note: string) => {
    approveMutation.mutate(
      { id, data: { approvalStatus: status, note } },
      {
        onSuccess: () => {
          const label = translatePartnerApprovalStatus(status);
          toast({ title: `파트너 상태가 '${label}'(으)로 변경되었습니다.` });
          queryClient.invalidateQueries({ queryKey: getAdminListPartnersQueryKey({ approvalStatus: activeTab === "all" ? undefined : activeTab }) });
          setSelectedPartner(null);
        },
        onError: () => toast({ title: "상태 변경 실패", variant: "destructive" }),
      }
    );
  };

  const partners: Partner[] = (data?.partners ?? []) as Partner[];
  const filtered = search
    ? partners.filter((p) => p.name.includes(search) || p.phone.includes(search))
    : partners;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">파트너 관리</h1>
            <p className="text-gray-500 mt-1">경력, 자격증, 지역을 검토하여 파트너를 승인하세요.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="이름, 연락처 검색..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto pb-2 border-b no-scrollbar">
          <div className="flex gap-2">
            {TABS.map((tab) => (
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
                  <th className="px-5 py-4 font-medium">지역</th>
                  <th className="px-5 py-4 font-medium">경력</th>
                  <th className="px-5 py-4 font-medium">유형</th>
                  <th className="px-5 py-4 font-medium">상태</th>
                  <th className="px-5 py-4 font-medium">가입일</th>
                  <th className="px-5 py-4 font-medium text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-20 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-20 text-center text-gray-500">
                      등록된 파트너가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((partner) => (
                    <tr
                      key={partner.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedPartner(partner)}
                    >
                      <td className="px-5 py-4 font-medium text-gray-900">{partner.name}</td>
                      <td className="px-5 py-4 text-gray-600">{partner.phone}</td>
                      <td className="px-5 py-4 text-gray-600 max-w-[120px] truncate">{partner.serviceArea || "-"}</td>
                      <td className="px-5 py-4 text-gray-600">{partner.experienceYears !== undefined ? `${partner.experienceYears}년` : "-"}</td>
                      <td className="px-5 py-4 text-gray-600">{partner.businessType === "business" ? "사업자" : "개인"}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={partner.approvalStatus} />
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {new Date(partner.createdAt).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          onClick={(e) => { e.stopPropagation(); setSelectedPartner(partner); }}
                          data-testid={`btn-detail-${partner.id}`}
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPartner && (
        <DetailModal
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
          onAction={(status, note) => handleAction(selectedPartner.id, status, note)}
          isPending={approveMutation.isPending}
        />
      )}
    </AdminLayout>
  );
}
