import { useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useListPackages,
  useListServiceManuals,
  useCreateServiceManual,
  useDeleteServiceManual,
  useRequestUploadUrl,
  useGeneratePackageVideo,
  useGetPackageVideo,
  useGetStandardManual,
  useCreateStandardManual,
  useDeleteStandardManual,
  getGetPackageVideoQueryKey,
  getGetStandardManualQueryKey,
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
  Sparkles,
  RefreshCw,
  FileDown,
  BookMarked,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import VideoPlayer, { VideoScene, VideoPlayerLoading, VideoPlayerEmpty } from "@/components/VideoPlayer";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const STANDARD_MANUAL_ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function fileTypeIcon(fileType: string) {
  if (fileType.startsWith("video/")) return <Video className="w-4 h-4 text-purple-500" />;
  return <FileText className="w-4 h-4 text-blue-500" />;
}

function fileTypeLabel(fileType: string) {
  if (fileType === "application/pdf") return "PDF";
  if (fileType.startsWith("video/")) return "동영상";
  if (fileType.includes("wordprocessingml") || fileType.includes("msword")) return "Word";
  return fileType.split("/")[1]?.toUpperCase() ?? fileType;
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function standardManualLabel(fileType: string) {
  if (fileType === "application/pdf") return "PDF";
  if (fileType.includes("wordprocessingml") || fileType.includes("msword")) return "Word";
  return "문서";
}

function StandardManualSection({ packageId, packageName }: { packageId: string; packageName: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const requestUploadUrl = useRequestUploadUrl();
  const createStandardManual = useCreateStandardManual();
  const deleteStandardManual = useDeleteStandardManual();

  const { data: manual, isLoading } = useGetStandardManual(packageId, {
    query: { retry: false },
  });

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast({ title: "파일을 선택해주세요", variant: "destructive" });
      return;
    }
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      toast({ title: "PDF 또는 Word 파일만 등록할 수 있습니다", variant: "destructive" });
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

      await createStandardManual.mutateAsync({
        packageId,
        data: {
          title: file.name.replace(/\.(pdf|doc|docx)$/i, ""),
          fileType: file.type || "application/pdf",
          objectPath,
          originalName: file.name,
          fileSize: file.size,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getGetStandardManualQueryKey(packageId) });
      setSelectedFileName(null);
      if (fileRef.current) fileRef.current.value = "";
      toast({ title: "표준 매뉴얼이 등록되었습니다" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "등록 실패";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("표준 매뉴얼을 삭제하시겠습니까?")) return;
    try {
      await deleteStandardManual.mutateAsync({ packageId });
      await queryClient.invalidateQueries({ queryKey: getGetStandardManualQueryKey(packageId) });
      toast({ title: "삭제되었습니다" });
    } catch {
      toast({ title: "삭제 실패", variant: "destructive" });
    }
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BookMarked className="w-4 h-4 text-blue-600" />
        <span className="font-semibold text-sm text-blue-800">표준 매뉴얼</span>
        <span className="text-xs text-blue-500 ml-1">(AI 동영상 생성의 기준 자료)</span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          불러오는 중...
        </div>
      ) : manual ? (
        <div className="flex items-center gap-3 bg-white rounded-md border border-blue-200 p-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{manual.originalName}</p>
            <p className="text-xs text-gray-400">
              {standardManualLabel(manual.fileType)}
              {manual.fileSize ? ` · ${formatBytes(manual.fileSize)}` : ""}
            </p>
          </div>
          <a
            href={`${BASE}/api/storage${manual.objectPath}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline whitespace-nowrap"
          >
            <FileDown className="w-3.5 h-3.5" />
            다운로드
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-400 hover:text-red-600 flex-shrink-0"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-blue-500 bg-blue-100/50 rounded p-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          표준 매뉴얼을 등록하면 AI 동영상이 매뉴얼 내용을 기반으로 생성됩니다
        </div>
      )}

      <div className="flex gap-2">
        <label className="flex-1 flex items-center gap-2 px-3 py-2 border border-blue-200 bg-white rounded-md cursor-pointer hover:bg-blue-50 text-sm text-gray-600">
          <Upload className="w-4 h-4 flex-shrink-0 text-blue-500" />
          <span className="truncate">{selectedFileName ?? (manual ? "새 파일로 교체" : "PDF / Word 파일 선택")}</span>
          <input
            ref={fileRef}
            type="file"
            accept={STANDARD_MANUAL_ACCEPT}
            className="hidden"
            onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
        <Button
          onClick={handleUpload}
          disabled={uploading || !selectedFileName}
          size="sm"
          className="whitespace-nowrap bg-blue-600 hover:bg-blue-700"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mr-1" />
          )}
          등록
        </Button>
      </div>
    </div>
  );
}

function AiVideoSection({ packageId, packageName }: { packageId: string; packageName: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const generateVideo = useGeneratePackageVideo();

  const { data: standardManual } = useGetStandardManual(packageId, {
    query: { retry: false },
  });

  const { data: videoData, isLoading: videoLoading, refetch } = useGetPackageVideo(packageId, {
    query: {
      retry: false,
      refetchInterval: (query) => {
        const status = (query.state.data as { status?: string } | undefined)?.status;
        return status === "pending" ? 2000 : false;
      },
    },
  });

  async function handleGenerate() {
    const basis = standardManual
      ? `등록된 표준 매뉴얼(${standardManual.originalName})을 기반으로`
      : "패키지 정보를 기반으로";
    if (!confirm(`"${packageName}" 서비스의 AI 동영상 스크립트를\n${basis} 생성하시겠습니까?\n(10~30초 소요)`)) return;
    setGenerating(true);
    try {
      await generateVideo.mutateAsync({ packageId });
      toast({ title: "AI 동영상 생성을 시작했습니다." });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: getGetPackageVideoQueryKey(packageId) });
        refetch();
        setGenerating(false);
      }, 2000);
    } catch {
      toast({ title: "생성 요청 실패", variant: "destructive" });
      setGenerating(false);
    }
  }

  const scenes = videoData?.script as VideoScene[] | null | undefined;
  const status = videoData?.status;

  return (
    <div className="border-t pt-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-violet-500" />
        <span className="font-medium text-sm">AI 자동 생성 동영상</span>
        {standardManual && (
          <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
            표준매뉴얼 기반
          </span>
        )}
        {status === "ready" && scenes && scenes.length > 0 && (
          <span className="ml-auto text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">생성 완료</span>
        )}
        {status === "error" && (
          <span className="ml-auto text-xs text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">오류</span>
        )}
      </div>

      {videoLoading ? (
        <VideoPlayerLoading />
      ) : status === "pending" ? (
        <VideoPlayerLoading />
      ) : status === "ready" && scenes && scenes.length > 0 ? (
        <div className="space-y-3">
          <VideoPlayer scenes={scenes} packageName={packageName} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
            className="w-full text-violet-600 border-violet-200 hover:bg-violet-50"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            다시 생성
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {status === "error" && (
            <p className="text-xs text-red-500">
              {(videoData as { errorMessage?: string } | undefined)?.errorMessage}
            </p>
          )}
          <VideoPlayerEmpty />
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {standardManual ? "표준매뉴얼 기반 AI 동영상 생성" : "AI 동영상 자동 생성"}
          </Button>
        </div>
      )}
    </div>
  );
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
          {/* Standard Manual */}
          <StandardManualSection packageId={packageId} packageName={packageName} />

          {/* Additional Manuals */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : manuals && manuals.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">추가 첨부 파일</p>
              <ul className="space-y-2">
                {manuals.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 p-3 rounded-md bg-gray-50 border">
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
            </div>
          ) : null}

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">추가 파일 첨부</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="파일 제목"
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

          <AiVideoSection packageId={packageId} packageName={packageName} />
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
        <div>
          <h1 className="text-xl font-bold">서비스 매뉴얼 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            패키지별 표준 매뉴얼(PDF/Word)을 등록하고, 이를 기반으로 AI 동영상을 자동 생성합니다.
          </p>
        </div>

        <div className="rounded-lg border bg-amber-50 border-amber-200 p-4 text-sm text-amber-700">
          <p className="font-medium mb-1">사용 방법</p>
          <ol className="space-y-1 text-amber-600 list-decimal list-inside">
            <li>패키지를 클릭하여 펼친 후 <strong>표준 매뉴얼</strong>에 PDF 또는 Word 파일을 등록합니다</li>
            <li>표준 매뉴얼 등록 후 <strong>AI 동영상 자동 생성</strong> 버튼을 클릭합니다</li>
            <li>AI가 매뉴얼 내용을 분석하여 6단계 서비스 안내 동영상을 자동 생성합니다</li>
          </ol>
        </div>

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
