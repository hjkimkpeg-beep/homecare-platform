import { useState, useEffect, useRef } from "react";
import { Play, RefreshCw, Loader2 } from "lucide-react";

export interface VideoScene {
  step: number;
  title: string;
  description: string;
  emoji: string;
}

interface VideoPlayerProps {
  scenes: VideoScene[];
  packageName: string;
  autoPlay?: boolean;
}

const SCENE_DURATION = 5000;

const BG_COLORS = [
  ["#0f172a", "#1e3a5f"],
  ["#1a0533", "#3b1a6e"],
  ["#0a2e1a", "#0f5132"],
  ["#1a1a0a", "#4a3200"],
  ["#0a1a2e", "#0f3b5f"],
  ["#1a0a0a", "#5f1a1a"],
];

export default function VideoPlayer({ scenes, packageName, autoPlay = true }: VideoPlayerProps) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = scenes.length;

  function clearTimers() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  }

  function goTo(idx: number) {
    setVisible(false);
    setTimeout(() => {
      setCurrent(idx);
      setProgress(0);
      setVisible(true);
    }, 350);
  }

  useEffect(() => {
    if (!playing || total === 0) return;
    clearTimers();

    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + 100 / (SCENE_DURATION / 100), 100));
    }, 100);

    intervalRef.current = setInterval(() => {
      setProgress(0);
      goTo((prev) => (prev + 1) % total);
    }, SCENE_DURATION);

    return clearTimers;
  }, [playing, current, total]);

  if (total === 0) return null;

  const scene = scenes[current];
  const [bg1, bg2] = BG_COLORS[current % BG_COLORS.length];

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-2xl select-none" style={{ aspectRatio: "16/9", minHeight: 200 }}>
      <div
        className="relative w-full h-full flex flex-col"
        style={{ background: `linear-gradient(135deg, ${bg1} 0%, ${bg2} 100%)` }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-white/60 text-[11px] font-medium tracking-widest uppercase">{packageName}</span>
          <div className="flex gap-1">
            {scenes.map((_, i) => (
              <button
                key={i}
                onClick={() => { goTo(i); }}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === current ? "bg-white w-5" : "bg-white/30 w-2"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Main content */}
        <div
          className="flex-1 flex flex-col items-center justify-center px-6 text-center"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.35s ease, transform 0.35s ease",
          }}
        >
          {/* Emoji */}
          <div
            className="text-5xl md:text-6xl mb-4"
            style={{ filter: "drop-shadow(0 0 20px rgba(255,255,255,0.3))" }}
          >
            {scene.emoji}
          </div>

          {/* Step badge */}
          <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-full px-3 py-1 mb-3">
            <span className="text-white/70 text-xs font-medium">STEP</span>
            <span className="text-white text-xs font-bold">{String(scene.step).padStart(2, "0")}</span>
            <span className="text-white/40 text-xs">/</span>
            <span className="text-white/50 text-xs">{String(total).padStart(2, "0")}</span>
          </div>

          {/* Title */}
          <h2 className="text-white font-bold text-lg md:text-2xl leading-tight mb-3" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
            {scene.title}
          </h2>

          {/* Description */}
          <p className="text-white/75 text-sm md:text-base leading-relaxed max-w-sm">
            {scene.description}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 px-4 pb-3 pt-1">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 transition flex items-center justify-center"
          >
            {playing ? (
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <Play className="w-3 h-3 text-white ml-0.5" fill="white" />
            )}
          </button>

          {/* Progress bar */}
          <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>

          <button
            onClick={() => { setProgress(0); goTo(0); }}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 transition flex items-center justify-center"
          >
            <RefreshCw className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function VideoPlayerLoading() {
  return (
    <div className="w-full rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center" style={{ aspectRatio: "16/9", minHeight: 200 }}>
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/50 mx-auto mb-3" />
        <p className="text-white/50 text-sm">동영상 생성 중...</p>
      </div>
    </div>
  );
}

export function VideoPlayerEmpty() {
  return (
    <div className="w-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200" style={{ aspectRatio: "16/9", minHeight: 200 }}>
      <div className="text-center text-gray-400">
        <div className="text-4xl mb-2">🎬</div>
        <p className="text-sm">아직 생성된 동영상이 없습니다</p>
      </div>
    </div>
  );
}
