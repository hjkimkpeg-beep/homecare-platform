import { useState } from "react";
import { CustomerLayout } from "@/components/layout/customer-layout";
import {
  useListPackages,
  useListServiceManuals,
  useListExternalVideos,
  useGetStandardManual,
} from "@workspace/api-client-react";
import {
  FolderOpen, BookOpen, BookMarked, Film, FileText, FileDown,
  ChevronDown, ChevronRight, Loader2,
} from "lucide-react";
import ExternalVideoPlayer, { ExternalVideoItem } from "@/components/ExternalVideoPlayer";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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

function PackageManualSection({ packageId, packageName }: { packageId: string; packageName: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: standard, isLoading: loadingStd } = useGetStandardManual(packageId, { query: { retry: false, enabled: expanded } });
  const { data: serviceManuals, isLoading: loadingSvc } = useListServiceManuals(packageId, { query: { enabled: expanded } });
  const { data: videos } = useListExternalVideos(packageId, { query: { enabled: expanded } });

  const hasContent = standard || (serviceManuals && serviceManuals.length > 0) || (videos && videos.length > 0);

  return (
    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderOpen className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-gray-900">{packageName}</span>
        </div>
        {expanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t divide-y">
          {loadingStd || loadingSvc ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : !hasContent ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              아직 등록된 자료가 없습니다
            </div>
          ) : (
            <>
              {/* Standard Manual */}
              {standard && (
                <div className="px-4 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookMarked className="w-4 h-4 text-blue-600" />
                    <h3 className="font-medium text-sm text-gray-800">표준 매뉴얼</h3>
                  </div>
                  <a
                    href={`${BASE}/api/storage${standard.objectPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-gray-800 truncate">{standard.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {standardManualLabel(standard.fileType)}
                        {standard.fileSize ? ` · ${formatBytes(standard.fileSize)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 text-xs font-medium whitespace-nowrap">
                      <FileDown className="w-4 h-4" />
                      다운로드
                    </div>
                  </a>
                </div>
              )}

              {/* Service Manuals */}
              {serviceManuals && serviceManuals.length > 0 && (
                <div className="px-4 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-green-600" />
                    <h3 className="font-medium text-sm text-gray-800">서비스 매뉴얼</h3>
                  </div>
                  <div className="space-y-2">
                    {serviceManuals.map((m) => (
                      <a
                        key={m.id}
                        href={`${BASE}/api/storage${m.objectPath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-gray-800 truncate">{m.title}</p>
                          <p className="text-xs text-gray-400">{m.originalName}</p>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-xs whitespace-nowrap">
                          <FileDown className="w-4 h-4" />
                          다운로드
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {videos && videos.length > 0 && (
                <div className="px-4 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Film className="w-4 h-4 text-purple-600" />
                    <h3 className="font-medium text-sm text-gray-800">서비스 동영상</h3>
                    <span className="text-xs text-gray-400">{videos.length}개</span>
                  </div>
                  <div className="space-y-4">
                    {videos.map((v) => (
                      <div key={v.id}>
                        <p className="text-sm font-medium text-gray-700 mb-2">{v.title}</p>
                        <ExternalVideoPlayer video={v as ExternalVideoItem} />
                        {v.description && (
                          <p className="text-sm text-gray-500 mt-2">{v.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function CustomerResourcesPage() {
  const { data: packages, isLoading } = useListPackages();

  return (
    <CustomerLayout>
      <div className="px-4 pt-6 pb-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">자료실</h1>
            <p className="text-sm text-gray-500">서비스 매뉴얼 및 동영상 자료</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: BookMarked, label: "표준 매뉴얼", color: "text-blue-600 bg-blue-50" },
            { icon: BookOpen, label: "서비스 매뉴얼", color: "text-green-600 bg-green-50" },
            { icon: Film, label: "동영상", color: "text-purple-600 bg-purple-50" },
          ].map((item) => (
            <div key={item.label} className="bg-white border rounded-xl p-3 flex flex-col items-center gap-2 text-center shadow-sm">
              <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center`}>
                <item.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !packages || packages.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>등록된 서비스가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg) => (
              <PackageManualSection key={pkg.id} packageId={pkg.id} packageName={pkg.name} />
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
