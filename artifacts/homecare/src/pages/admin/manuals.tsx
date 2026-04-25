import { useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useListPackages,
  useListServiceManuals,
  useCreateServiceManual,
  useDeleteServiceManual,
  useRequestUploadUrl,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListServiceManualsQueryKey } from "@workspace/api-client-react";
import {
  Loader2,
  Upload,
  Trash2,
  FileText,
  Video,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function fileTypeIcon(fileType: string) {
  if (fileType.startsWith("video/")) return <Video className="w-4 h-4 text-purple-500" />;
  return <FileText className="w-4 h-4 text-blue-500" />;
}

function fileTypeLabel(fileType: string) {
  if (fileType === "application/pdf") return "PDF";
  if (fileType.startsWith("video/")) return "동영상";
  return fileType.split("/")[1]?.toUpperCase() ?? fileType;
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function PackageManuals({ packageId, packageName }: { packageId: string; packageName: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const { data: manuals, isLoading } = useListServiceManuals(packageId, {
    query: { enabled: expanded },
  });
  const requestUploadUrl = useRequestUploadUrl();
  const createManual = useCreateServiceManual();
  const deleteManual = useDeleteServiceManual();

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast({ title: "파일을 선택해주세요", variant: "destructive" });
      return;
    }
    if (!title.trim()) {
      toast({ title: "매뉴얼 제목을 입력해주세요", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const { uploadURL, objectPath } = await requestUploadUrl.mutateAsync({
        name: file.name,
        size: file.size,
        contentType: file.type || "application/octet-stream",
      });

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!uploadRes.ok) throw new Error("파일 업로드에 실패했습니다");

      await createManual.mutateAsync({
        packageId,
        data: {
          title: title.trim(),
          fileType: file.type || "application/octet-stream",
          objectPath,
          originalName: file.name,
          fileSize: file.size,
          sortOrder: manuals?.length ?? 0,
        },
      });

      await queryClient.invalidateQueries({ queryKey: getListServiceManualsQueryKey(packageId) });
      setTitle("");
      setSelectedFileName(null);
      if (fileRef.current) fileRef.current.value = "";
      toast({ title: "매뉴얼이 등록되었습니다" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "업로드 실패";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(manualId: number) {
    if (!confirm("매뉴얼을 삭제하시겠습니까?")) return;
    try {
      await deleteManual.mutateAsync({ packageId, manualId });
      await queryClient.invalidateQueries({ queryKey: getListServiceManualsQueryKey(packageId) });
      toast({ title: "삭제되었습니다" });
    } catch {
      toast({ title: "삭제 실패", variant: "destructive" });
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left font-medium text-sm"
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
        <span>{packageName}</span>
        {manuals && (
          <span className="ml-auto text-xs text-gray-400">{manuals.length}개</span>
        )}
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : manuals && manuals.length > 0 ? (
            <ul className="space-y-2">
              {manuals.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-md bg-gray-50 border"
                >
                  {fileTypeIcon(m.fileType)}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{m.title}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {m.originalName} · {fileTypeLabel(m.fileType)}
                      {m.fileSize ? ` · ${formatBytes(m.fileSize)}` : ""}
                    </p>
                  </div>
                  <a
                    href={`${BASE}/api/storage${m.objectPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                  >
                    미리보기
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 h-7 w-7"
                    onClick={() => handleDelete(m.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">등록된 매뉴얼이 없습니다.</p>
          )}

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">새 매뉴얼 추가</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="매뉴얼 제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1"
              />
              <label className="flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50 text-sm whitespace-nowrap">
                <Upload className="w-4 h-4" />
                {selectedFileName ?? "파일 선택"}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,video/*"
                  className="hidden"
                  onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name ?? null)}
                />
              </label>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="whitespace-nowrap"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                등록
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminManuals() {
  const { data: packages, isLoading } = useListPackages();

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <h1 className="text-xl font-bold">서비스 매뉴얼 관리</h1>
        <p className="text-sm text-gray-500">
          패키지별로 PDF 또는 동영상 매뉴얼을 등록하고 관리합니다.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !packages || packages.length === 0 ? (
          <p className="text-gray-500 text-sm">등록된 패키지가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {packages.map((pkg) => (
              <PackageManuals key={pkg.id} packageId={pkg.id} packageName={pkg.name} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
