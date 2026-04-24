import { CustomerLayout } from "@/components/layout/customer-layout";
import { Link } from "wouter";
import { ChevronRight, Clock, Star, Users, KeyRound, Shield, Wrench } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const HERO_STATS = [
  { label: "고객 만족도", value: "4.8점 평균", icon: Star },
  { label: "검증된 기술자", value: "전문 파트너", icon: Users },
  { label: "빠른 서비스",  value: "당일 예약",  icon: Clock },
];

const TRUST_ITEMS = [
  {
    icon: Shield,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    title: "품질 보증",
    desc: "모든 서비스는 완료 후 30일 품질 보증이 적용됩니다. 문제 발생 시 무상 A/S를 제공합니다.",
  },
  {
    icon: Star,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    title: "검증된 파트너",
    desc: "모든 파트너는 기술 검증과 배경 조회를 거쳐 선발된 전문가입니다.",
  },
  {
    icon: Wrench,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-500",
    title: "정가제 운영",
    desc: "서비스 시작 전 가격이 고정됩니다. 추가 비용이나 숨겨진 요금이 없습니다.",
  },
];

export default function CustomerHome() {
  const { user } = useAuth();

  return (
    <CustomerLayout>
      <section className="bg-[#0f1729] min-h-[calc(100dvh-56px)] relative overflow-hidden flex items-center">
        {/* grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative w-full px-6 sm:px-10 lg:px-20 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* ─ Left: main content ─ */}
          <div>
            <div className="inline-flex items-center gap-2 mb-8">
              <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-white" />
              </div>
              <span className="text-blue-400 text-sm font-semibold tracking-wide">HomeCare Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-white leading-tight mb-6">
              집 수리, 이제<br />
              <span className="text-blue-400">정가제</span>로 믿고 맡기세요
            </h1>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-10">
              전문 파트너가 고정 가격으로 방문합니다.<br />
              추가 비용 없이 투명하게, 품질 보증까지 받으세요.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/packages">
                <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base shadow-lg shadow-blue-500/30">
                  서비스 예약하기
                  <ChevronRight className="w-5 h-5" />
                </button>
              </Link>
              <Link href="/booking-lookup">
                <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base border border-white/20">
                  예약 현황 조회
                </button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-8 mt-12 pt-10 border-t border-white/10">
              {HERO_STATS.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white text-base font-bold">{value}</p>
                    <p className="text-gray-500 text-xs">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─ Right: trust cards ─ */}
          <div className="hidden lg:grid grid-cols-1 gap-4">
            {TRUST_ITEMS.map(({ icon: Icon, iconBg, iconColor, title, desc }) => (
              <div
                key={title}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-start gap-4"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-white font-semibold mb-1">{title}</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </CustomerLayout>
  );
}
