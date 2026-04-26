import { useState, useRef, useCallback } from "react";
import { Play, ExternalLink, Film, Volume2, VolumeX } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0`;
  }
  return null;
}

function getVimeoEmbedUrl(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}?autoplay=1`;
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

function speakKorean(text: string, onEnd?: () => void) {
  if (!window.speechSynthesis) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  const trySpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    const koreanVoice = voices.find((v) => v.lang.startsWith("ko"));
    if (koreanVoice) utterance.voice = koreanVoice;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    trySpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = trySpeak;
  }
}

export default function ExternalVideoPlayer({ video, className = "" }: ExternalVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const { type, src } = getVideoSrc(video.videoType, video.videoUrl, video.objectPath);

  const introText = video.description
    ? `${video.title}. ${video.description}`
    : `${video.title} 서비스 동영상입니다.`;

  const handlePlay = useCallback(() => {
    setSpeaking(true);
    speakKorean(introText, () => {
      setSpeaking(false);
      setStarted(true);
    });
  }, [introText]);

  const handleSkip = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setStarted(true);
  }, []);

  if (!src) {
    return (
      <div
        className={`rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400 ${className}`}
        style={{ aspectRatio: "16/9", minHeight: 200 }}
      >
        <div className="text-center">
          <Film className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">동영상을 재생할 수 없습니다</p>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div
        className={`rounded-xl overflow-hidden shadow-md bg-gradient-to-br from-gray-800 to-gray-900 relative flex items-center justify-center ${className}`}
        style={{ aspectRatio: "16/9", minHeight: 200 }}
      >
        <div className="flex flex-col items-center justify-center gap-4 p-6 text-center w-full h-full">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
            <Film className="w-8 h-8 text-white/60" />
          </div>
          <div>
            <p className="text-white font-semibold text-base mb-1">{video.title}</p>
            {video.description && (
              <p className="text-gray-400 text-sm">{video.description}</p>
            )}
          </div>
          {speaking ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-white/80 text-sm bg-white/10 px-4 py-2 rounded-full">
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span>한국어 음성 안내 중...</span>
              </div>
              <button
                onClick={handleSkip}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <VolumeX className="w-3.5 h-3.5" />
                건너뛰기
              </button>
            </div>
          ) : (
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-full transition-colors shadow-lg"
            >
              <Play className="w-5 h-5 fill-white" />
              동영상 보기
            </button>
          )}
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
      <div
        className={`rounded-xl overflow-hidden shadow-md bg-black ${className}`}
        style={{ aspectRatio: "16/9" }}
      >
        <video
          ref={videoRef}
          src={src}
          controls
          autoPlay
          className="w-full h-full object-contain"
        >
          지원하지 않는 브라우저입니다.
        </video>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center ${className}`}
      style={{ aspectRatio: "16/9", minHeight: 200 }}
    >
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
