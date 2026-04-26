import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useListProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useListPackages,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp,
  FolderKanban, User, Phone, MapPin, Calendar, Users, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "planning", label: "계획중" },
  { value: "in_progress", label: "진행중" },
  { value: "completed", label: "완료" },
  { value: "cancelled", label: "취소" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  planning: { label: "계획중", color: "bg-yellow-100 text-yellow-800" },
  in_progress: { label: "진행중", color: "bg-blue-100 text-blue-800" },
  completed: { label: "완료", color: "bg-green-100 text-green-800" },
  cancelled: { label: "취소", color: "bg-gray-100 text-gray-600" },
};

type Project = {
  id: string;
  title: string;
  orderId?: string | null;
  packageId?: string | null;
  applicantName: string;
  applicantPhone: string;
  applicantAddress?: string | null;
  serviceContent?: string | null;
  partnerId?: string | null;
  partnerName?: string | null;
  notes?: string | null;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
};

type FormState = {
  title: string;
  applicantName: string;
  applicantPhone: string;
  applicantAddress: string;
  serviceContent: string;
  notes: string;
  status: string;
  startDate: string;
  endDate: string;
  packageId: string;
};

const emptyForm: FormState = {
  title: "",
  applicantName: "",
  applicantPhone: "",
  applicantAddress: "",
  serviceContent: "",
  notes: "",
  status: "planning",
  startDate: "",
  endDate: "",
  packageId: "",
};

export default function AdminProjectsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: projects, isLoading } = useListProjects(
    statusFilter ? { status: statusFilter } : {},
    { query: { refetchOnMount: true } }
  );
  const { data: packages } = useListPackages();

  const createProject = useCreateProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).includes("listProjects") });
        setShowForm(false);
        setForm(emptyForm);
        toast({ title: "프로젝트가 등록되었습니다" });
      },
      onError: () => toast({ title: "등록에 실패했습니다", variant: "destructive" }),
    },
  });

  const updateProject = useUpdateProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).includes("listProjects") });
        setEditingId(null);
        setForm(emptyForm);
        toast({ title: "프로젝트가 수정되었습니다" });
      },
      onError: () => toast({ title: "수정에 실패했습니다", variant: "destructive" }),
    },
  });

  const deleteProject = useDeleteProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).includes("listProjects") });
        setDeleteConfirm(null);
        toast({ title: "프로젝트가 삭제되었습니다" });
      },
      onError: () => toast({ title: "삭제에 실패했습니다", variant: "destructive" }),
    },
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(p: Project) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      applicantName: p.applicantName,
      applicantPhone: p.applicantPhone,
      applicantAddress: p.applicantAddress || "",
      serviceContent: p.serviceContent || "",
      notes: p.notes || "",
      status: p.status,
      startDate: p.startDate ? p.startDate.slice(0, 10) : "",
      endDate: p.endDate ? p.endDate.slice(0, 10) : "",
      packageId: p.packageId || "",
    });
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.applicantName.trim() || !form.applicantPhone.trim()) {
      toast({ title: "제목, 신청자명, 연락처는 필수입니다", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        applicantName: form.applicantName.trim(),
        applicantPhone: form.applicantPhone.trim(),
        applicantAddress: form.applicantAddress.trim() || undefined,
        serviceContent: form.serviceContent.trim() || undefined,
        notes: form.notes.trim() || undefined,
        status: form.status,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        packageId: form.packageId || undefined,
      };
      if (editingId) {
        await updateProject.mutateAsync({ projectId: editingId, data: payload });
      } else {
        await createProject.mutateAsync({ data: payload });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderKanban className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">프로젝트 관리</h1>
              <p className="text-sm text-gray-500">각 서비스를 단위 프로젝트로 관리합니다</p>
            </div>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            프로젝트 등록
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === s.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                {editingId ? "프로젝트 수정" : "새 프로젝트 등록"}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">프로젝트 제목 *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="예: 강남구 홍길동 - 에어컨 청소"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">신청자명 *</label>
                <Input
                  value={form.applicantName}
                  onChange={(e) => setForm((f) => ({ ...f, applicantName: e.target.value }))}
                  placeholder="신청자 이름"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">연락처 *</label>
                <Input
                  value={form.applicantPhone}
                  onChange={(e) => setForm((f) => ({ ...f, applicantPhone: e.target.value }))}
                  placeholder="010-0000-0000"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">서비스 주소</label>
                <Input
                  value={form.applicantAddress}
                  onChange={(e) => setForm((f) => ({ ...f, applicantAddress: e.target.value }))}
                  placeholder="서비스 제공 주소"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">서비스 패키지</label>
                <select
                  value={form.packageId}
                  onChange={(e) => setForm((f) => ({ ...f, packageId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="">선택 안함</option>
                  {packages?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">상태</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
                >
                  {STATUS_OPTIONS.filter((s) => s.value).map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">시작일</label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">완료 예정일</label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">서비스 내용</label>
                <Textarea
                  value={form.serviceContent}
                  onChange={(e) => setForm((f) => ({ ...f, serviceContent: e.target.value }))}
                  placeholder="수행할 서비스 내용을 상세히 기록하세요"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">특기사항</label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="특이사항, 주의사항 등을 기록하세요"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>
                취소
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? "수정" : "등록"}
              </Button>
            </div>
          </div>
        )}

        {/* Project List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !projects?.length ? (
          <div className="text-center py-16 text-gray-400">
            <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>등록된 프로젝트가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => {
              const st = STATUS_LABELS[p.status] ?? { label: p.status, color: "bg-gray-100 text-gray-600" };
              const isExpanded = expandedId === p.id;
              return (
                <div key={p.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{p.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{p.applicantName}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{p.applicantPhone}</span>
                        {p.partnerName && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{p.partnerName}</span>}
                        {p.startDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{p.startDate?.slice(0, 10)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p as any)}>
                        <Pencil className="w-4 h-4 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(p.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t px-4 py-4 bg-gray-50 space-y-3 text-sm">
                      {p.applicantAddress && (
                        <div className="flex gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <span className="text-gray-700">{p.applicantAddress}</span>
                        </div>
                      )}
                      {p.serviceContent && (
                        <div>
                          <p className="font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                            <ClipboardList className="w-4 h-4" />서비스 내용
                          </p>
                          <p className="text-gray-600 whitespace-pre-line bg-white rounded-lg p-3 border">{p.serviceContent}</p>
                        </div>
                      )}
                      {p.notes && (
                        <div>
                          <p className="font-medium text-gray-700 mb-1">특기사항</p>
                          <p className="text-gray-600 whitespace-pre-line bg-white rounded-lg p-3 border">{p.notes}</p>
                        </div>
                      )}
                      {p.endDate && (
                        <p className="text-gray-500">완료 예정: {p.endDate?.slice(0, 10)}</p>
                      )}
                    </div>
                  )}
                  {deleteConfirm === p.id && (
                    <div className="border-t px-4 py-3 bg-red-50 flex items-center justify-between">
                      <p className="text-sm text-red-700">정말 이 프로젝트를 삭제하시겠습니까?</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>취소</Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteProject.mutateAsync({ projectId: p.id })}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
