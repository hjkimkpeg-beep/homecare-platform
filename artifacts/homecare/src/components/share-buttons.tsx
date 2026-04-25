import { useState, useEffect } from "react";
import { Link2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (options: object) => void;
      };
    };
  }
}

interface ShareButtonsProps {
  title?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  label?: string;
}

export function ShareButtons({
  title = "HomeCare – 집 수리, 정가제로 믿고 맡기세요",
  description = "전문 파트너가 고정 가격으로 방문합니다. 추가 비용 없이 투명하게!",
  url,
  imageUrl,
  label = "공유하기",
}: ShareButtonsProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      const key = import.meta.env.VITE_KAKAO_APP_KEY;
      if (key) window.Kakao.init(key);
    }
  }, []);

  const handleKakao = () => {
    if (window.Kakao?.isInitialized()) {
      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title,
          description,
          imageUrl: imageUrl ?? `${window.location.origin}/favicon.svg`,
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
        buttons: [{ title: "자세히 보기", link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
      });
    } else {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
      toast({
        title: "링크가 복사되었습니다",
        description: "카카오톡 채팅창에서 붙여넣기 하세요.",
      });
    }
  };

  const handleBand = () => {
    window.open(
      `https://band.us/plugin/share?body=${encodeURIComponent(`${title}\n${shareUrl}`)}&route=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,width=600,height=500"
    );
  };

  const handleFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,width=600,height=500"
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast({ title: "링크가 복사되었습니다!" });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast({ title: "복사에 실패했습니다.", variant: "destructive" });
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-400 mr-1 shrink-0">{label}</span>

      {/* KakaoTalk */}
      <button
        onClick={handleKakao}
        title="카카오톡으로 공유"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80 active:scale-95"
        style={{ backgroundColor: "#FEE500", color: "#3A1D1D" }}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor">
          <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.73 1.612 5.13 4.069 6.61L5.1 21l4.286-2.285C10.19 18.9 11.083 19 12 19c5.523 0 10-3.477 10-7.8C22 6.477 17.523 3 12 3z"/>
        </svg>
        카카오톡
      </button>

      {/* Naver Band */}
      <button
        onClick={handleBand}
        title="네이버 밴드로 공유"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-80 active:scale-95"
        style={{ backgroundColor: "#1EC800" }}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
        </svg>
        밴드
      </button>

      {/* Facebook */}
      <button
        onClick={handleFacebook}
        title="페이스북으로 공유"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-80 active:scale-95"
        style={{ backgroundColor: "#1877F2" }}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
        </svg>
        페이스북
      </button>

      {/* Copy Link */}
      <button
        onClick={handleCopy}
        title="링크 복사"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors active:scale-95"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
        {copied ? "복사됨" : "링크 복사"}
      </button>
    </div>
  );
}
