import { useState } from "react";
import {
  useListPackages,
  useListServiceManuals,
  useGetPackageVideo,
  useListExternalVideos,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Loader2,
  FileText,
  Video,
  ChevronDown,
  ChevronRight,
  Download,
  Package,
  CheckCircle,
  BookOpen,
  LogOut,
  Sparkles,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoPlayer, { VideoScene, VideoPlayerLoading } from "@/components/VideoPlayer";
import ExternalVideoPlayer, { ExternalVideoItem } from "@/components/ExternalVideoPlayer";

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
  const [expanded, setExpanded] = useState(false);
  const { data: manuals, isLoading } = useListServiceManuals(packageId, {
    query: { enabled: expanded },
  });
  const { data: videoData, isLoading: videoLoading } = useGetPackageVideo(packageId, {
    query: {
      enabled: expanded,
      retry: false,
      refetchInterval: (query) => {
        const status = (query.state.data as { status?: string } | undefined)?.status;
        return status === "pending" ? 3000 : false;
      },
    },
  });

  const { data: externalVideos } = useListExternalVideos(packageId, {
    query: { enabled: expanded, retry: false },
  });

  const scenes = videoData?.script as VideoScene[] | null | undefined;
  const videoReady = videoData?.status === "ready" && scenes && scenes.length > 0;
  const hasExternalVideos = externalVideos && externalVideos.length > 0;

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
        <div className="ml-auto flex items-center gap-2">
          {hasExternalVideos && (
            <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 flex items-center gap-1">
              <Film className="w-3 h-3" />
              동영상 {externalVideos.length}개
            </span>
          )}
          {videoReady && (
            <span className="text-xs text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI 동영상
            </span>
          )}
          {manuals && (
            <span className="text-xs text-gray-400">{manuals.length}개</span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* AI Video */}
          {videoLoading ? (
            <VideoPlayerLoading />
          ) : videoData?.status === "pending" ? (
            <VideoPlayerLoading />
          ) : videoReady ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-medium text-violet-700">AI 서비스 안내 동영상</span>
              </div>
              <VideoPlayer scenes={scenes!} packageName={packageName} />
            </div>
          ) : null}

          {/* External Videos */}
          {hasExternalVideos && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Film className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">서비스 동영상</span>
              </div>
              <div className="space-y-4">
                {externalVideos!.map((v) => (
                  <div key={v.id}>
                    <p className="text-xs font-medium text-gray-500 mb-1.5">{v.title}</p>
                    <ExternalVideoPlayer video={v as ExternalVideoItem} />
                    {v.description && (
                      <p className="text-xs text-gray-400 mt-1">{v.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manuals list */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : !manuals || manuals.length === 0 ? (
            !videoReady && <p className="text-sm text-gray-400">등록된 매뉴얼이 없습니다.</p>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">첨부 파일</p>
              <ul className="space-y-2">
                {manuals.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 p-3 rounded-md bg-gray-50 border">
                    {fileTypeIcon(m.fileType)}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{m.title}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {fileTypeLabel(m.fileType)}
                        {m.fileSize ? ` · ${formatBytes(m.fileSize)}` : ""}
                      </p>
                    </div>
                    <a
                      href={`${BASE}/api/storage${m.objectPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      열기
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PartnerManuals() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { data: packages, isLoading } = useListPackages();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      <header className="bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="font-bold text-lg">서비스 매뉴얼</h1>
        <Button variant="ghost" size="icon" onClick={logout} data-testid="btn-logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <main className="flex-1 p-4 pb-20 space-y-4">
        <p className="text-sm text-gray-500">서비스별 작업 매뉴얼 및 AI 안내 동영상을 확인하세요.</p>

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
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t flex">
        <button
          className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-400"
          onClick={() => setLocation("/partner/jobs")}
        >
          <Package className="h-5 w-5" />
          <span className="text-xs">배차목록</span>
        </button>
        <button
          className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-400"
          onClick={() => setLocation("/partner/history")}
        >
          <CheckCircle className="h-5 w-5" />
          <span className="text-xs">작업이력</span>
        </button>
        <button className="flex-1 py-3 flex flex-col items-center gap-1 text-primary border-t-2 border-primary">
          <BookOpen className="h-5 w-5" />
          <span className="text-xs font-medium">매뉴얼</span>
        </button>
      </nav>
    </div>
  );
}
