import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Loader2, Megaphone, Copy, CheckCheck, RefreshCw } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const PACKAGES = [
  { value: "", label: "전체 홈케어 서비스" },
  { value: "에어컨 클리닝", label: "에어컨 클리닝" },
  { value: "보일러/난방 점검", label: "보일러/난방 점검" },
  { value: "욕실 실리콘 보수", label: "욕실 실리콘 보수" },
  { value: "도배/장판", label: "도배/장판" },
  { value: "전기 점검", label: "전기 점검" },
];

const AUDIENCES = [
  { value: "신혼부부", label: "신혼부부" },
  { value: "노년층", label: "노년층" },
  { value: "직장인", label: "직장인" },
  { value: "가족/부모", label: "가족/부모" },
  { value: "임산부/영유아 가정", label: "임산부/영유아 가정" },
  { value: "1인 가구", label: "1인 가구" },
];

const CHANNELS = [
  { value: "카카오톡", label: "카카오톡" },
  { value: "SMS", label: "SMS" },
  { value: "소셜미디어(인스타그램/페이스북)", label: "소셜미디어" },
  { value: "이메일", label: "이메일" },
  { value: "배너/디스플레이 광고", label: "배너 광고" },
];

const TONES = [
  { value: "친근하고 따뜻한", label: "친근하고 따뜻한" },
  { value: "전문적이고 신뢰감 있는", label: "전문적이고 신뢰감 있는" },
  { value: "긴급하고 촉구하는", label: "긴급/촉구형" },
  { value: "유머러스하고 가벼운", label: "유머러스한" },
  { value: "감성적이고 공감하는", label: "감성적/공감형" },
];

export default function AdminMarketing() {
  const [packageName, setPackageName] = useState("");
  const [targetAudience, setTargetAudience] = useState("신혼부부");
  const [channel, setChannel] = useState("카카오톡");
  const [tone, setTone] = useState("친근하고 따뜻한");
  const [additionalContext, setAdditionalContext] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (loading) return;
    setResult("");
    setLoading(true);
    setCopied(false);

    try {
      const res = await fetch(`${BASE}/api/openai/marketing/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          packageName: packageName || undefined,
          targetAudience,
          channel,
          tone,
          additionalContext: additionalContext || undefined,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("생성 실패");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6)) as { delta?: string; done?: boolean };
              if (parsed.delta) {
                text += parsed.delta;
                setResult(text);
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } catch {
      setResult("오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">마케팅 AI</h1>
            <p className="text-sm text-gray-500">AI를 활용하여 효과적인 마케팅 문구를 자동 생성합니다</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 className="font-semibold text-gray-800 text-base">생성 조건 설정</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">서비스 패키지</label>
              <select
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              >
                {PACKAGES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">대상 고객</label>
              <div className="flex flex-wrap gap-2">
                {AUDIENCES.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setTargetAudience(a.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      targetAudience === a.value
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">채널</label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setChannel(c.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      channel === c.value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">톤앤매너</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      tone === t.value
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">추가 요청사항 (선택)</label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="예: 봄맞이 특별 할인 10% 포함, 예약 마감 임박 강조 등"
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              />
            </div>

            <Button
              onClick={generate}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-11"
              data-testid="btn-generate-marketing"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Megaphone className="w-4 h-4 mr-2" />
                  마케팅 문구 생성
                </>
              )}
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 text-base">생성된 문구</h2>
              <div className="flex gap-2">
                {result && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="text-xs h-8 gap-1.5"
                    >
                      {copied ? (
                        <CheckCheck className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copied ? "복사됨" : "복사"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generate}
                      disabled={loading}
                      className="text-xs h-8 gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      재생성
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100 p-4 min-h-[300px]">
              {!result && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                  <Megaphone className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">조건을 설정하고 생성 버튼을 누르면</p>
                  <p className="text-sm">마케팅 문구가 여기에 표시됩니다</p>
                </div>
              )}
              {(result || loading) && (
                <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                  {result}
                  {loading && result && (
                    <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-0.5 align-middle" />
                  )}
                </pre>
              )}
            </div>

            {result && (
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                AI 생성 완료 · 내용을 검토 후 사용하세요
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
