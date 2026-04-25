import { useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useListPackages,
  useListExternalVideos,
  useCreateExternalVideo,
  useUpdateExternalVideo,
  useDeleteExternalVideo,
  useRequestUploadUrl,
  getListExternalVideosQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Link2,
  Upload,
  Film,
  Youtube,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ExternalVideoPlayer, { ExternalVideoItem } from "@/components/ExternalVideoPlayer";

type VideoType = "url" | "upload";

function videoTypeLabel(videoType: string, videoUrl?: string | null) {
  if (videoType === "upload") return "파일 업로드";
  if (videoUrl?.includes("youtube") || videoUrl?.includes("youtu.be")) return "YouTube";
  if (videoUrl?.includes("vimeo")) return "Vimeo";
  return "외부 URL";
}

function VideoTypeIcon({ videoType, videoUrl }: { videoType: string; videoUrl?: string | null }) {
  if (videoType === "upload") return <Film className="w-4 h-4 text-purple-500" />;
  if (videoUrl?.includes("youtube") || videoUrl?.includes("youtu.be"))
    return <Youtube className="w-4 h-4 text-red-500" />;
  return <Link2 className="w-4 h-4 text-blue-500" />;
}

interface AddVideoFormProps {
  packageId: string;
  onDone: () => void;
  currentCount: number;
}

function AddVideoForm({ packageId, onDone, currentCount }: AddVideoFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [videoType, setVideoType] = useState<VideoType>("url");
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const createVideo = useCreateExternalVideo();
  const requestUploadUrl = useRequestUploadUrl();

  async function handleSubmit() {
    if (!title.trim()) {
      toast({ title: "제목을 입력해주세요", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      if (videoType === "url") {
        if (!videoUrl.trim()) {
          toast({ title: "URL을 입력해주세요", variant: "destructive" });
          return;
        }
        await createVideo.mutateAsync({
          packageId,
          data: { title: title.trim(), videoType: "url", videoUrl: videoUrl.trim(), description: description.trim() || undefined },
        });
      } else {
        const file = fileRef.current?.files?.[0];
        if (!file) {
          toast({ title: "파일을 선택해주세요", variant: "destructive" });
          return;
        }
        const { uploadURL, objectPath } = await requestUploadUrl.mutateAsync({
          data: {
            name: file.name,
            size: file.size,
            contentType: file.type || "video/mp4",
          },
        });
        const uploadRes = await fetch(uploadURL, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "video/mp4" },
        });
        if (!uploadRes.ok) throw new Error("파일 업로드 실패");
        await createVideo.mutateAsync({
          packageId,
          data: { title: title.trim(), videoType: "upload", objectPath, description: description.trim() || undefined },
        });
      }
      await queryClient.invalidateQueries({ queryKey: getListExternalVideosQueryKey(packageId) });
      toast({ title: "동영상이 등록되었습니다" });
      onDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "등록 실패";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
      <p className="text-sm font-semibold text-gray-700">새 동영상 등록</p>

      {/* Type selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setVideoType("url")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${
            videoType === "url"
              ? "border-primary bg-primary/5 text-primary font-medium"
              : "border-gray-200 text-gray-500 hover:bg-gray-100"
          }`}
        >
          <Link2 className="w-4 h-4" />
          URL 입력
        </button>
        <button
          onClick={() => setVideoType("upload")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${
            videoType === "upload"
              ? "border-primary bg-primary/5 text-primary font-medium"
              : "border-gray-200 text-gray-500 hover:bg-gray-100"
          }`}
        >
          <Upload className="w-4 h-4" />
          파일 업로드
        </button>
      </div>

      {/* Title */}
      <Input
        placeholder="동영상 제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* URL or File */}
      {videoType === "url" ? (
        <Input
          placeholder="YouTube URL, Vimeo URL, 또는 직접 동영상 URL"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
      ) : (
        <label className="flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-white text-sm text-gray-600 w-full">
          <Upload className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{selectedFileName ?? "동영상 파일 선택 (MP4, WebM, MOV)"}</span>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
      )}

      {/* Description */}
      <Textarea
        placeholder="설명 (선택)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="resize-none"
      />

      {/* Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={uploading} size="sm" className="flex-1">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          등록
        </Button>
        <Button variant="outline" size="sm" onClick={onDone} disabled={uploading}>
          <X className="w-4 h-4 mr-2" />
          취소
        </Button>
      </div>
    </div>
  );
}

interface VideoItemRowProps {
  video: ExternalVideoItem;
  packageId: string;
  onDeleted: () => void;
}

function VideoItemRow({ video, packageId, onDeleted }: VideoItemRowProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description ?? "");
  const [previewing, setPreviewing] = useState(false);
  const deleteVideo = useDeleteExternalVideo();
  const updateVideo = useUpdateExternalVideo();

  async function handleDelete() {
    if (!confirm(`"${video.title}" 동영상을 삭제하시겠습니까?`)) return;
    try {
      await deleteVideo.mutateAsync({ packageId, videoId: video.id });
      await queryClient.invalidateQueries({ queryKey: getListExternalVideosQueryKey(packageId) });
      toast({ title: "삭제되었습니다" });
      onDeleted();
    } catch {
      toast({ title: "삭제 실패", variant: "destructive" });
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      toast({ title: "제목을 입력해주세요", variant: "destructive" });
      return;
    }
    try {
      await updateVideo.mutateAsync({
        packageId,
        videoId: video.id,
        data: { title: title.trim(), description: description.trim() || undefined },
      });
      await queryClient.invalidateQueries({ queryKey: getListExternalVideosQueryKey(packageId) });
      toast({ title: "수정되었습니다" });
      setEditing(false);
    } catch {
      toast({ title: "수정 실패", variant: "destructive" });
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-3 bg-white">
        <VideoTypeIcon videoType={video.videoType} videoUrl={video.videoUrl} />
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-7 text-sm mb-1"
              autoFocus
            />
          ) : (
            <p className="font-medium text-sm truncate">{video.title}</p>
          )}
          <p className="text-xs text-gray-400">
            {videoTypeLabel(video.videoType, video.videoUrl)}
            {video.videoUrl && (
              <span className="ml-1 truncate max-w-[180px] inline-block align-bottom">
                · {video.videoUrl.length > 40 ? video.videoUrl.slice(0, 40) + "…" : video.videoUrl}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-blue-600"
            onClick={() => setPreviewing((p) => !p)}
            title="미리보기"
          >
            <Play className="w-3.5 h-3.5" />
          </Button>
          {editing ? (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={handleSave}>
                <Check className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400" onClick={() => { setEditing(false); setTitle(video.title); }}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-700" onClick={() => setEditing(true)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {editing && (
        <div className="px-3 pb-3 bg-white border-t">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="설명 (선택)"
            rows={2}
            className="resize-none text-sm mt-2"
          />
        </div>
      )}

      {previewing && (
        <div className="p-3 bg-gray-50 border-t">
          <ExternalVideoPlayer video={video} />
          {video.description && (
            <p className="text-sm text-gray-500 mt-2">{video.description}</p>
          )}
        </div>
      )}
    </div>
  );
}

function PackageVideos({ packageId, packageName }: { packageId: string; packageName: string }) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const { data: videos, isLoading } = useListExternalVideos(packageId, {
    query: { enabled: expanded },
  });

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
        <Film className="w-4 h-4 text-violet-500" />
        <span>{packageName}</span>
        {videos && (
          <span className="ml-auto text-xs text-gray-400">{videos.length}개</span>
        )}
      </button>

      {expanded && (
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : !videos || videos.length === 0 ? (
            <p className="text-sm text-gray-400">등록된 동영상이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {videos.map((v) => (
                <VideoItemRow
                  key={`${v.id}-${refresh}`}
                  video={v as ExternalVideoItem}
                  packageId={packageId}
                  onDeleted={() => setRefresh((r) => r + 1)}
                />
              ))}
            </div>
          )}

          {adding ? (
            <AddVideoForm
              packageId={packageId}
              currentCount={videos?.length ?? 0}
              onDone={() => setAdding(false)}
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdding(true)}
              className="w-full border-dashed text-gray-500 hover:text-gray-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              동영상 추가
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminVideos() {
  const { data: packages, isLoading } = useListPackages();

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold">동영상 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            패키지별로 외부 제작 동영상을 등록하고 관리합니다.
            YouTube, Vimeo URL 또는 직접 파일을 업로드할 수 있습니다.
          </p>
        </div>

        <div className="rounded-lg border bg-blue-50 border-blue-200 p-4 text-sm text-blue-700">
          <p className="font-medium mb-1">지원하는 동영상 형식</p>
          <ul className="space-y-1 text-blue-600">
            <li>· YouTube — 유튜브 공유 URL 또는 전체 URL</li>
            <li>· Vimeo — Vimeo 링크</li>
            <li>· 직접 파일 — MP4, WebM, MOV 파일 업로드</li>
            <li>· 기타 URL — 직접 접근 가능한 동영상 링크</li>
          </ul>
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
              <PackageVideos key={pkg.id} packageId={pkg.id} packageName={pkg.name} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
