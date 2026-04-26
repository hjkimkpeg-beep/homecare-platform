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
  useListExternalVideos,
  useCreateExternalVideo,
  useUpdateExternalVideo,
  useDeleteExternalVideo,
  getGetPackageVideoQueryKey,
  getGetStandardManualQueryKey,
  getListServiceManualsQueryKey,
  getListExternalVideosQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Upload, Trash2, FileText, Video, ChevronDown, ChevronRight,
  CheckCircle2, Sparkles, FileDown, AlertCircle, BookMarked,
  Plus, Pencil, Check, X, FolderOpen, Film, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import VideoPlayer, { VideoScene, VideoPlayerLoading, VideoPlayerEmpty } from "@/components/VideoPlayer";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const STANDARD_MANUAL_ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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

// ── 표준 매뉴얼 섹션 ──────────────────────────────────────────────────────
function StandardManualSection({ packageId, packageName }: { packageId: string; packageName: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const requestUploadUrl = useRequestUploadUrl();
  const createStandardManual = useCreateStandardManual();
  const deleteStandardManual = useDeleteStandardManual();

  const { data: manual, isLoading } = useGetStandardManual(packageId, {
    query: { retry: false, enabled: expanded },
  });

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast({ title: "파일을 선택해주세요", variant: "destructive" }); return; }
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      toast({ title: "PDF 또는 Word 파일만 등록할 수 있습니다", variant: "destructive" }); return;
    }
    setUploading(true);
    try {
      const { uploadURL, objectPath } = await requestUploadUrl.mutateAsync({
        data: { name: file.name, size: file.size, contentType: file.type || "application/octet-stream" },
      });
      const uploadRes = await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
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
      toast({ title: err instanceof Error ? err.message : "업로드 실패", variant: "destructive" });
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
    <div className="border rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-sm">{packageName}</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {expanded && (
        <div className="border-t bg-blue-50/40 p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-blue-600"><Loader2 className="w-4 h-4 animate-spin" />불러오는 중...</div>
          ) : manual ? (
            <div className="flex items-center gap-3 bg-white rounded-md border border-blue-200 p-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{manual.originalName}</p>
                <p className="text-xs text-gray-400">{standardManualLabel(manual.fileType)}{manual.fileSize ? ` · ${formatBytes(manual.fileSize)}` : ""}</p>
              </div>
              <a href={`${BASE}/api/storage${manual.objectPath}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline whitespace-nowrap">
                <FileDown className="w-3.5 h-3.5" />다운로드
              </a>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 flex-shrink-0" onClick={handleDelete}>
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
              <input ref={fileRef} type="file" accept={STANDARD_MANUAL_ACCEPT} className="hidden" onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name ?? null)} />
            </label>
            <Button onClick={handleUpload} disabled={uploading || !selectedFileName} size="sm" className="whitespace-nowrap bg-blue-600 hover:bg-blue-700">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}등록
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 서비스 매뉴얼 섹션 ─────────────────────────────────────────────────────
function ServiceManualSection({ packageId, packageName }: { packageId: string; packageName: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const { data: manuals, isLoading } = useListServiceManuals(packageId, { query: { enabled: expanded } });
  const requestUploadUrl = useRequestUploadUrl();
  const createManual = useCreateServiceManual();
  const deleteManual = useDeleteServiceManual();

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast({ title: "파일을 선택해주세요", variant: "destructive" }); return; }
    if (!title.trim()) { toast({ title: "매뉴얼 제목을 입력해주세요", variant: "destructive" }); return; }
    setUploading(true);
    try {
      const { uploadURL, objectPath } = await requestUploadUrl.mutateAsync({
        data: { name: file.name, size: file.size, contentType: file.type || "application/octet-stream" },
      });
      const uploadRes = await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
      if (!uploadRes.ok) throw new Error("파일 업로드에 실패했습니다");
      await createManual.mutateAsync({
        packageId,
        data: { title: title.trim(), fileType: file.type || "application/octet-stream", objectPath, originalName: file.name, fileSize: file.size, sortOrder: manuals?.length ?? 0 },
      });
      await queryClient.invalidateQueries({ queryKey: getListServiceManualsQueryKey(packageId) });
      setTitle(""); setSelectedFileName(null);
      if (fileRef.current) fileRef.current.value = "";
      toast({ title: "매뉴얼이 등록되었습니다" });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "업로드 실패", variant: "destructive" });
    } finally { setUploading(false); }
  }

  async function handleDelete(manualId: number) {
    if (!confirm("매뉴얼을 삭제하시겠습니까?")) return;
    try {
      await deleteManual.mutateAsync({ packageId, manualId });
      await queryClient.invalidateQueries({ queryKey: getListServiceManualsQueryKey(packageId) });
      toast({ title: "삭제되었습니다" });
    } catch { toast({ title: "삭제 실패", variant: "destructive" }); }
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <button onClick={() => setExpanded((e) => !e)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-green-600" />
          <span className="font-medium text-sm">{packageName}</span>
          {manuals !== undefined && <span className="text-xs text-gray-400">{manuals.length}개</span>}
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {expanded && (
        <div className="border-t p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin" />불러오는 중...</div>
          ) : manuals && manuals.length > 0 ? (
            <ul className="space-y-1.5">
              {manuals.map((m) => (
                <li key={m.id} className="flex items-center gap-2 bg-gray-50 rounded p-2 text-sm">
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-700 truncate">{m.title}</p>
                    <p className="text-xs text-gray-400">{m.originalName}</p>
                  </div>
                  <a href={`${BASE}/api/storage${m.objectPath}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline whitespace-nowrap flex items-center gap-1">
                    <FileDown className="w-3.5 h-3.5" />다운로드
                  </a>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 h-7 w-7" onClick={() => handleDelete(m.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">등록된 매뉴얼이 없습니다</p>
          )}
          <div className="border-t pt-3 flex flex-col sm:flex-row gap-2">
            <Input placeholder="파일 제목" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" />
            <label className="flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50 text-sm whitespace-nowrap">
              <Upload className="w-4 h-4" />
              {selectedFileName ?? "파일 선택"}
              <input ref={fileRef} type="file" accept=".pdf,video/*" className="hidden" onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name ?? null)} />
            </label>
            <Button onClick={handleUpload} disabled={uploading} className="whitespace-nowrap">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}등록
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 동영상 섹션 ────────────────────────────────────────────────────────────
type VideoItem = {
  id: number; packageId: string; title: string; videoType: string;
  videoUrl?: string | null; objectPath?: string | null;
  description?: string | null; sortOrder: number; createdAt: string; updatedAt: string;
};

function VideoSection({ packageId, packageName }: { packageId: string; packageName: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState(""); const [url, setUrl] = useState("");
  const [description, setDescription] = useState(""); const [uploadMode, setUploadMode] = useState(false);
  const [uploading, setUploading] = useState(false); const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const { data: videos, isLoading } = useListExternalVideos(packageId, { query: { enabled: expanded } });
  const requestUploadUrl = useRequestUploadUrl();
  const createVideo = useCreateExternalVideo();
  const updateVideo = useUpdateExternalVideo();
  const deleteVideo = useDeleteExternalVideo();

  function resetForm() { setTitle(""); setUrl(""); setDescription(""); setUploadMode(false); setSelectedFileName(null); if (fileRef.current) fileRef.current.value = ""; }

  async function handleAdd() {
    if (!title.trim()) { toast({ title: "제목을 입력하세요", variant: "destructive" }); return; }
    setUploading(true);
    try {
      if (uploadMode) {
        const file = fileRef.current?.files?.[0];
        if (!file) { toast({ title: "파일을 선택해주세요", variant: "destructive" }); setUploading(false); return; }
        const { uploadURL, objectPath } = await requestUploadUrl.mutateAsync({ data: { name: file.name, size: file.size, contentType: file.type || "video/mp4" } });
        const uploadRes = await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type || "video/mp4" } });
        if (!uploadRes.ok) throw new Error("파일 업로드 실패");
        await createVideo.mutateAsync({ packageId, data: { title: title.trim(), videoType: "upload", objectPath, description: description.trim() || undefined } });
      } else {
        if (!url.trim()) { toast({ title: "URL을 입력하세요", variant: "destructive" }); setUploading(false); return; }
        await createVideo.mutateAsync({ packageId, data: { title: title.trim(), videoType: "external", videoUrl: url.trim(), description: description.trim() || undefined } });
      }
      await queryClient.invalidateQueries({ queryKey: getListExternalVideosQueryKey(packageId) });
      setShowAdd(false); resetForm();
      toast({ title: "동영상이 등록되었습니다" });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "등록 실패", variant: "destructive" });
    } finally { setUploading(false); }
  }

  async function handleUpdate(v: VideoItem) {
    if (!title.trim()) { toast({ title: "제목을 입력하세요", variant: "destructive" }); return; }
    await updateVideo.mutateAsync({ packageId, videoId: v.id, data: { title: title.trim(), description: description.trim() || undefined, videoUrl: url.trim() || undefined } });
    await queryClient.invalidateQueries({ queryKey: getListExternalVideosQueryKey(packageId) });
    setEditingId(null); resetForm();
    toast({ title: "수정되었습니다" });
  }

  async function handleDelete(videoId: number) {
    if (!confirm("동영상을 삭제하시겠습니까?")) return;
    await deleteVideo.mutateAsync({ packageId, videoId });
    await queryClient.invalidateQueries({ queryKey: getListExternalVideosQueryKey(packageId) });
    toast({ title: "삭제되었습니다" });
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <button onClick={() => setExpanded((e) => !e)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-purple-600" />
          <span className="font-medium text-sm">{packageName}</span>
          {videos !== undefined && <span className="text-xs text-gray-400">{videos.length}개</span>}
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {expanded && (
        <div className="border-t p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin" />불러오는 중...</div>
          ) : videos && videos.length > 0 ? (
            <div className="space-y-2">
              {videos.map((v) => (
                <div key={v.id}>
                  {editingId === v.id ? (
                    <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
                      <Input placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} />
                      <Input placeholder="URL (선택)" value={url} onChange={(e) => setUrl(e.target.value)} />
                      <Input placeholder="설명 (선택)" value={description} onChange={(e) => setDescription(e.target.value)} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdate(v as any)}><Check className="w-3.5 h-3.5 mr-1" />저장</Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingId(null); resetForm(); }}><X className="w-3.5 h-3.5 mr-1" />취소</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5 text-sm">
                      <Video className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-gray-800">{v.title}</p>
                        {v.videoUrl && <p className="text-xs text-gray-400 truncate">{v.videoUrl}</p>}
                        {v.objectPath && <p className="text-xs text-gray-400">업로드 파일</p>}
                        {v.description && <p className="text-xs text-gray-500">{v.description}</p>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(v.id); setTitle(v.title); setUrl(v.videoUrl ?? ""); setDescription(v.description ?? ""); }}>
                        <Pencil className="w-3.5 h-3.5 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(v.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">등록된 동영상이 없습니다</p>
          )}

          {showAdd ? (
            <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
              <Input placeholder="동영상 제목 *" value={title} onChange={(e) => setTitle(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => setUploadMode(false)} className={`flex-1 py-1.5 rounded text-sm border transition-colors ${!uploadMode ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200"}`}>URL 입력</button>
                <button onClick={() => setUploadMode(true)} className={`flex-1 py-1.5 rounded text-sm border transition-colors ${uploadMode ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200"}`}>파일 업로드</button>
              </div>
              {!uploadMode ? (
                <Input placeholder="YouTube/Vimeo URL 또는 직접 링크" value={url} onChange={(e) => setUrl(e.target.value)} />
              ) : (
                <label className="flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50 text-sm">
                  <Upload className="w-4 h-4 text-gray-400" />{selectedFileName ?? "동영상 파일 선택 (MP4, MOV 등)"}
                  <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name ?? null)} />
                </label>
              )}
              <Input placeholder="설명 (선택)" value={description} onChange={(e) => setDescription(e.target.value)} />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd} disabled={uploading}>{uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}등록</Button>
                <Button size="sm" variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}><X className="w-3.5 h-3.5 mr-1" />취소</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}><Plus className="w-3.5 h-3.5 mr-1.5" />동영상 추가</Button>
          )}
        </div>
      )}
    </div>
  );
}

// ── AI 동영상 섹션 (탭 4) ──────────────────────────────────────────────────
function AiVideoSection({ packageId, packageName }: { packageId: string; packageName: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const generateVideo = useGeneratePackageVideo();
  const { data: standardManual } = useGetStandardManual(packageId, { query: { retry: false } });
  const { data: videoData, isLoading: videoLoading } = useGetPackageVideo(packageId, {
    query: {
      retry: false,
      refetchInterval: (query) => {
        const status = (query.state.data as { status?: string } | undefined)?.status;
        return status === "pending" ? 2000 : false;
      },
    },
  });

  const status = (videoData as any)?.status;
  const scenes = (videoData as any)?.script as VideoScene[] | null | undefined;
  const videoReady = status === "ready" && scenes && scenes.length > 0;

  async function handleGenerate() {
    const basis = standardManual ? `등록된 표준 매뉴얼(${standardManual.originalName})을 기반으로` : "패키지 정보를 기반으로";
    if (!confirm(`"${packageName}" AI 동영상 스크립트를\n${basis} 생성하시겠습니까?`)) return;
    setGenerating(true);
    try {
      await generateVideo.mutateAsync({ packageId });
      await queryClient.invalidateQueries({ queryKey: getGetPackageVideoQueryKey(packageId) });
      toast({ title: "AI 동영상 생성 요청이 완료되었습니다" });
    } catch { toast({ title: "동영상 생성 실패", variant: "destructive" });
    } finally { setGenerating(false); }
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <button onClick={() => setExpanded((e) => !e)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <span className="font-medium text-sm">{packageName}</span>
          {videoReady && <span className="text-xs text-green-600 font-medium">생성됨</span>}
          {status === "pending" && <span className="text-xs text-yellow-600 font-medium">생성중...</span>}
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {expanded && (
        <div className="border-t p-4 space-y-3">
          {videoLoading ? <VideoPlayerLoading /> :
            videoReady ? <VideoPlayer scenes={scenes!} packageName={packageName} /> :
            status === "pending" ? <VideoPlayerLoading /> :
            <VideoPlayerEmpty />}
          <Button onClick={handleGenerate} disabled={generating} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {standardManual ? "표준매뉴얼 기반 AI 동영상 생성" : "AI 동영상 자동 생성"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────────────────
type Tab = "standard" | "service" | "videos" | "ai";

const TABS: { value: Tab; label: string; icon: typeof FolderOpen }[] = [
  { value: "standard", label: "표준 매뉴얼", icon: BookMarked },
  { value: "service", label: "서비스 매뉴얼", icon: BookOpen },
  { value: "videos", label: "동영상", icon: Film },
  { value: "ai", label: "AI 동영상", icon: Sparkles },
];

export default function AdminResourcesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("standard");
  const { data: packages, isLoading } = useListPackages();

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">자료실</h1>
            <p className="text-sm text-gray-500">매뉴얼, 동영상 등 서비스 자료를 통합 관리합니다</p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.value
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !packages || packages.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-16">등록된 패키지가 없습니다</p>
        ) : (
          <div className="space-y-2">
            {activeTab === "standard" && (
              <>
                <div className="rounded-lg border bg-amber-50 border-amber-200 p-3 text-sm text-amber-700">
                  표준 매뉴얼(PDF/Word)을 등록하면 AI 동영상 생성 시 내용을 기반으로 스크립트가 작성됩니다
                </div>
                {packages.map((pkg) => <StandardManualSection key={pkg.id} packageId={pkg.id} packageName={pkg.name} />)}
              </>
            )}
            {activeTab === "service" && (
              <>
                <div className="rounded-lg border bg-green-50 border-green-200 p-3 text-sm text-green-700">
                  서비스 매뉴얼은 파트너가 현장에서 참고할 수 있는 작업 지침서입니다
                </div>
                {packages.map((pkg) => <ServiceManualSection key={pkg.id} packageId={pkg.id} packageName={pkg.name} />)}
              </>
            )}
            {activeTab === "videos" && (
              <>
                <div className="rounded-lg border bg-purple-50 border-purple-200 p-3 text-sm text-purple-700">
                  YouTube, Vimeo URL 또는 직접 업로드한 동영상을 패키지별로 관리합니다
                </div>
                {packages.map((pkg) => <VideoSection key={pkg.id} packageId={pkg.id} packageName={pkg.name} />)}
              </>
            )}
            {activeTab === "ai" && (
              <>
                <div className="rounded-lg border bg-violet-50 border-violet-200 p-3 text-sm text-violet-700">
                  AI가 표준 매뉴얼 내용을 분석하여 6단계 서비스 안내 동영상 스크립트를 자동 생성합니다
                </div>
                {packages.map((pkg) => <AiVideoSection key={pkg.id} packageId={pkg.id} packageName={pkg.name} />)}
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
