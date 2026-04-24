import { useListPackages, useListOrders } from "@workspace/api-client-react";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { Link } from "wouter";
import { translateOrderStatus } from "@/lib/format";
import {
  ChevronRight,
  Clock,
  Loader2,
  Zap,
  Heart,
  Leaf,
  KeyRound,
  CalendarCheck,
  Star,
  Users,
  Wrench,
  Shield,
  Home,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const PACKAGE_THEMES: Record<string, { icon: React.ElementType; iconBg: string; iconColor: string }> = {
  "90분 퀵픽스":   { icon: Zap,          iconBg: "bg-blue-50",    iconColor: "text-blue-500" },
  "시니어 안심":   { icon: Shield,        iconBg: "bg-green-50",   iconColor: "text-green-500" },
  "에너지 세이브": { icon: Leaf,          iconBg: "bg-emerald-50", iconColor: "text-emerald-500" },
  "임대 턴오버":   { icon: Home,          iconBg: "bg-orange-50",  iconColor: "text-orange-500" },
  "계절 점검":     { icon: CalendarCheck, iconBg: "bg-sky-50",     iconColor: "text-sky-500" },
};
const DEFAULT_THEME = { icon: Wrench, iconBg: "bg-gray-50", iconColor: "text-gray-500" };

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
  const { data: packages, isLoading: isPackagesLoading } = useListPackages();
  const { data: orders, isLoading: isOrdersLoading } = useListOrders(
    { status: "in_progress" },
    { query: { enabled: !!user } }
  );

  const activeOrder = orders?.[0];

  return (
    <CustomerLayout>
      {/* ── Dark Hero ── */}
      <section className="bg-[#0f1729] px-6 pt-12 pb-14 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <span className="text-blue-400 text-sm font-semibold tracking-wide">HomeCare Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
            집 수리, 이제<br />
            <span className="text-blue-400">정가제</span>로 믿고 맡기세요
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
            전문 파트너가 고정 가격으로 방문합니다.<br />
            추가 비용 없이 투명하게, 품질 보증까지 받으세요.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              onClick={() =>
                document.getElementById("packages-section")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              서비스 예약하기
              <ChevronRight className="w-4 h-4" />
            </button>
            <Link href={user ? "/orders" : "/login"}>
              <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm border border-white/10">
                예약 현황 조회
              </button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-6 mt-10 pt-8 border-t border-white/10">
            {HERO_STATS.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-white text-sm font-bold">{value}</p>
                  <p className="text-gray-500 text-[11px]">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Active Order Banner ── */}
      {!isOrdersLoading && activeOrder && (
        <div className="px-4 pt-4 bg-gray-50">
          <Link href={`/orders/${activeOrder.id}`}>
            <div className="bg-blue-600 rounded-2xl p-4 flex items-center justify-between shadow-md cursor-pointer">
              <div>
                <span className="inline-block text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full mb-1.5">
                  {translateOrderStatus(activeOrder.status)}
                </span>
                <p className="font-bold text-white">{activeOrder.packageName}</p>
                <p className="text-xs text-blue-200 mt-0.5">
                  {new Date(activeOrder.scheduledDate).toLocaleDateString("ko-KR", {
                    month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <ChevronRight className="text-white w-5 h-5" />
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ── Package Grid ── */}
      <section id="packages-section" className="bg-gray-50 px-4 sm:px-8 pt-12 pb-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-gray-900">서비스 패키지</h2>
          <p className="text-gray-500 text-sm mt-2">투명한 고정 가격으로 원하는 서비스를 선택하세요</p>
        </div>

        {isPackagesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {packages?.map((pkg) => {
              const theme = PACKAGE_THEMES[pkg.name] ?? DEFAULT_THEME;
              const Icon = theme.icon;
              return (
                <Link key={pkg.id} href={`/packages/${pkg.id}`}>
                  <div
                    className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
                    data-testid={`package-card-${pkg.id}`}
                  >
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${theme.iconBg}`}>
                      <Icon className={`w-5 h-5 ${theme.iconColor}`} />
                    </div>

                    {/* Name & description */}
                    <h3 className="font-bold text-gray-900 text-base mb-2">{pkg.name}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed flex-1 mb-5">{pkg.description}</p>

                    {/* Price row */}
                    <div className="flex items-end justify-between mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-gray-900">
                          {pkg.basePrice.toLocaleString("ko-KR")}
                        </span>
                        <span className="text-sm font-medium text-gray-500">원</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{pkg.estimatedMinutes}분</span>
                      </div>
                    </div>

                    {/* CTA button */}
                    <button className="w-full bg-[#111827] hover:bg-gray-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors">
                      예약하기
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Trust Section ── */}
      <section className="bg-gray-50 px-4 sm:px-8 pb-16 pt-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 pt-10 border-t border-gray-200">
          {TRUST_ITEMS.map(({ icon: Icon, iconBg, iconColor, title, desc }) => (
            <div key={title}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1.5">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </CustomerLayout>
  );
}
