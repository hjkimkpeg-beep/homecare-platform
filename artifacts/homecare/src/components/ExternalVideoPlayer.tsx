import { useState, useRef } from "react";
import { Play, ExternalLink, Film } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=0&rel=0`;
  }
  return null;
}

function getVimeoEmbedUrl(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  return null;
}

function getVideoSrc(videoType: string, videoUrl?: string | null, objectPath?: string | null): {
  type: "youtube" | "vimeo" | "html5" | "unknown";
  src: string;
} {
  if (videoType === "upload" && objectPath) {
    return { type: "html5", src: `${BASE}/api/storage${objectPath}` };
  }
  if (videoUrl) {
    const yt = getYouTubeEmbedUrl(videoUrl);
    if (yt) return { type: "youtube", src: yt };
    const vim = getVimeoEmbedUrl(videoUrl);
    if (vim) return { type: "vimeo", src: vim };
    if (videoUrl.match(/\.(mp4|webm|ogg|mov)$/i)) {
      return { type: "html5", src: videoUrl };
    }
    return { type: "unknown", src: videoUrl };
  }
  return { type: "unknown", src: "" };
}

export interface ExternalVideoItem {
  id: number;
  packageId: string;
  title: string;
  videoType: string;
  videoUrl?: string | null;
  objectPath?: string | null;
  description?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ExternalVideoPlayerProps {
  video: ExternalVideoItem;
  className?: string;
}

export default function ExternalVideoPlayer({ video, className = "" }: ExternalVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const { type, src } = getVideoSrc(video.videoType, video.videoUrl, video.objectPath);

  if (!src) {
    return (
      <div className={`rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400 ${className}`} style={{ aspectRatio: "16/9", minHeight: 200 }}>
        <div className="text-center">
          <Film className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">동영상을 재생할 수 없습니다</p>
        </div>
      </div>
    );
  }

  if (type === "youtube" || type === "vimeo") {
    return (
      <div className={`rounded-xl overflow-hidden shadow-md ${className}`} style={{ aspectRatio: "16/9" }}>
        <iframe
          src={src}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    );
  }

  if (type === "html5") {
    return (
      <div className={`rounded-xl overflow-hidden shadow-md bg-black ${className}`} style={{ aspectRatio: "16/9" }}>
        <video
          ref={videoRef}
          src={src}
          controls
          className="w-full h-full object-contain"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          지원하지 않는 브라우저입니다.
        </video>
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center ${className}`} style={{ aspectRatio: "16/9", minHeight: 200 }}>
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-3 text-white/70 hover:text-white transition"
      >
        <ExternalLink className="w-10 h-10" />
        <span className="text-sm">외부 링크에서 보기</span>
      </a>
    </div>
  );
}
