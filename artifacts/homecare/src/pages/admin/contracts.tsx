import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useListContractTemplates,
  useCreateContractTemplate,
  useUpdateContractTemplate,
  useDeleteContractTemplate,
  useListPackages,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, X, FileText, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Template = {
  id: string;
  packageId?: string | null;
  packageName?: string | null;
  title: string;
  content: string;
  version: string;
  isActive: boolean;
  createdAt: string;
};

type FormState = {
  packageId: string;
  title: string;
  content: string;
  version: string;
  isActive: boolean;
};

const DEFAULT_CONTRACT = `홈케어 서비스 파트너 표준 계약서

제1조 (목적)
본 계약은 홈케어 플랫폼(이하 "회사")과 파트너(이하 "파트너") 사이에 서비스 제공에 관한 기본적인 사항을 정함을 목적으로 합니다.

제2조 (서비스 범위)
파트너는 회사가 배정하는 가정 내 서비스를 성실하게 수행하여야 합니다.

제3조 (파트너의 의무)
1. 파트너는 서비스 시간을 준수하여야 합니다.
2. 파트너는 고객의 개인정보를 보호하여야 합니다.
3. 파트너는 서비스 품질 기준을 준수하여야 합니다.
4. 파트너는 업무 수행 중 발생한 사고를 즉시 신고하여야 합니다.

제4조 (수수료 및 정산)
서비스 완료 후 회사의 정책에 따라 수수료가 정산됩니다.

제5조 (계약 해지)
양 당사자는 30일 전 서면 통보로 계약을 해지할 수 있습니다.

제6조 (비밀 유지)
파트너는 업무 수행 중 알게 된 고객 정보 및 회사 정보를 외부에 유출하여서는 안 됩니다.

제7조 (준거법)
본 계약은 대한민국 법률에 따라 해석됩니다.`;

const emptyForm: FormState = {
  packageId: "",
  title: "파트너 서비스 표준 계약서",
  content: DEFAULT_CONTRACT,
  version: "1.0",
  isActive: true,
};

export default function AdminContractsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: templates, isLoading } = useListContractTemplates();
  const { data: packages } = useListPackages();

  const createTemplate = useCreateContractTemplate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).includes("listContractTemplates") });
        setShowForm(false);
        setForm(emptyForm);
        toast({ title: "계약서 템플릿이 등록되었습니다" });
      },
      onError: () => toast({ title: "등록에 실패했습니다", variant: "destructive" }),
    },
  });

  const updateTemplate = useUpdateContractTemplate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).includes("listContractTemplates") });
        setEditingId(null);
        setForm(emptyForm);
        setShowForm(false);
        toast({ title: "계약서 템플릿이 수정되었습니다" });
      },
      onError: () => toast({ title: "수정에 실패했습니다", variant: "destructive" }),
    },
  });

  const deleteTemplate = useDeleteContractTemplate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).includes("listContractTemplates") });
        setDeleteConfirm(null);
        toast({ title: "계약서 템플릿이 삭제되었습니다" });
      },
      onError: () => toast({ title: "삭제에 실패했습니다", variant: "destructive" }),
    },
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(t: Template) {
    setEditingId(t.id);
    setForm({
      packageId: t.packageId || "",
      title: t.title,
      content: t.content,
      version: t.version,
      isActive: t.isActive,
    });
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "제목과 내용은 필수입니다", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        packageId: form.packageId || undefined,
        title: form.title.trim(),
        content: form.content.trim(),
        version: form.version.trim() || "1.0",
        isActive: form.isActive,
      };
      if (editingId) {
        await updateTemplate.mutateAsync({ templateId: editingId, data: payload });
      } else {
        await createTemplate.mutateAsync({ data: payload });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">계약서 관리</h1>
              <p className="text-sm text-gray-500">파트너와의 표준 계약서를 관리합니다</p>
            </div>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            계약서 등록
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                {editingId ? "계약서 수정" : "새 계약서 등록"}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">계약서 제목 *</label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="계약서 제목"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">버전</label>
                  <Input
                    value={form.version}
                    onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                    placeholder="1.0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">적용 패키지 (선택)</label>
                  <select
                    value={form.packageId}
                    onChange={(e) => setForm((f) => ({ ...f, packageId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="">전체 공통 (패키지 무관)</option>
                    {packages?.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">활성화 (파트너에게 동의 요청)</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">계약서 내용 *</label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={16}
                  className="font-mono text-sm"
                  placeholder="계약서 내용을 입력하세요"
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

        {/* Template List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !templates?.length ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="mb-4">등록된 계약서 템플릿이 없습니다</p>
            <p className="text-sm">기본 계약서를 등록하면 파트너 신청 및 승인 시 사용됩니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <div key={t.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <FileText className="w-8 h-8 text-primary/70 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{t.title}</span>
                      <span className="text-xs text-gray-400">v{t.version}</span>
                      {t.packageName && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{t.packageName}</span>
                      )}
                      {!t.packageId && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">공통</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {t.isActive ? "활성" : "비활성"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      등록일: {new Date(t.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPreviewId(previewId === t.id ? null : t.id)}
                      title="내용 미리보기"
                    >
                      {previewId === t.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-gray-400" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                      <Pencil className="w-4 h-4 text-gray-400" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(t.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
                {previewId === t.id && (
                  <div className="border-t px-4 py-4 bg-gray-50">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">
                      {t.content}
                    </pre>
                  </div>
                )}
                {deleteConfirm === t.id && (
                  <div className="border-t px-4 py-3 bg-red-50 flex items-center justify-between">
                    <p className="text-sm text-red-700">정말 이 계약서를 삭제하시겠습니까?</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>취소</Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteTemplate.mutateAsync({ templateId: t.id })}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
