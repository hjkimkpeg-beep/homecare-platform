import { useListPackages } from "@workspace/api-client-react";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { Link } from "wouter";
import { Clock, Loader2, Zap, Leaf, CalendarCheck, Shield, Wrench, Star, Home } from "lucide-react";

const PACKAGE_THEMES: Record<string, { icon: React.ElementType; iconBg: string; iconColor: string }> = {
  "90분 퀵픽스":   { icon: Zap,          iconBg: "bg-blue-50",    iconColor: "text-blue-500" },
  "시니어 안심":   { icon: Shield,        iconBg: "bg-green-50",   iconColor: "text-green-500" },
  "에너지 세이브": { icon: Leaf,          iconBg: "bg-emerald-50", iconColor: "text-emerald-500" },
  "임대 턴오버":   { icon: Home,          iconBg: "bg-orange-50",  iconColor: "text-orange-500" },
  "계절 점검":     { icon: CalendarCheck, iconBg: "bg-sky-50",     iconColor: "text-sky-500" },
};
const DEFAULT_THEME = { icon: Wrench, iconBg: "bg-gray-50", iconColor: "text-gray-500" };

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

export default function PackagesPage() {
  const { data: packages, isLoading } = useListPackages();

  return (
    <CustomerLayout>
      <section className="bg-gray-50 px-4 sm:px-8 xl:px-16 2xl:px-24 pt-12 2xl:pt-20 pb-10 2xl:pb-16">
        <div className="text-center mb-10 2xl:mb-16">
          <h2 className="text-3xl 2xl:text-5xl font-extrabold text-gray-900">서비스 패키지</h2>
          <p className="text-gray-500 text-sm 2xl:text-lg mt-2 2xl:mt-4">투명한 고정 가격으로 원하는 서비스를 선택하세요</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 2xl:h-12 2xl:w-12 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-5 2xl:gap-8 max-w-5xl 2xl:max-w-[1440px] mx-auto">
            {packages?.map((pkg) => {
              const theme = PACKAGE_THEMES[pkg.name] ?? DEFAULT_THEME;
              const Icon = theme.icon;
              return (
                <Link key={pkg.id} href={`/packages/${pkg.id}`}>
                  <div
                    className="bg-white rounded-2xl 2xl:rounded-3xl p-5 2xl:p-8 border border-gray-100 hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
                    data-testid={`package-card-${pkg.id}`}
                  >
                    <div className={`w-11 h-11 2xl:w-16 2xl:h-16 rounded-xl 2xl:rounded-2xl flex items-center justify-center mb-4 2xl:mb-6 ${theme.iconBg}`}>
                      <Icon className={`w-5 h-5 2xl:w-8 2xl:h-8 ${theme.iconColor}`} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-base 2xl:text-xl mb-2 2xl:mb-3">{pkg.name}</h3>
                    <p className="text-gray-500 text-xs 2xl:text-sm leading-relaxed flex-1 mb-5 2xl:mb-8">{pkg.description}</p>
                    <div className="flex items-end justify-between mb-4 2xl:mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl 2xl:text-3xl font-extrabold text-gray-900">
                          {pkg.basePrice.toLocaleString("ko-KR")}
                        </span>
                        <span className="text-sm font-medium text-gray-500">원</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 text-xs 2xl:text-sm">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{pkg.estimatedMinutes}분</span>
                      </div>
                    </div>
                    <button className="w-full bg-[#111827] hover:bg-gray-700 text-white text-sm 2xl:text-base font-semibold py-3 2xl:py-4 rounded-xl transition-colors">
                      예약하기
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Trust Section */}
      <section className="bg-gray-50 px-4 sm:px-8 xl:px-16 2xl:px-24 pb-16 2xl:pb-24 pt-4">
        <div className="max-w-5xl 2xl:max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 2xl:gap-14 pt-10 2xl:pt-16 border-t border-gray-200">
          {TRUST_ITEMS.map(({ icon: Icon, iconBg, iconColor, title, desc }) => (
            <div key={title}>
              <div className={`w-10 h-10 2xl:w-14 2xl:h-14 rounded-xl 2xl:rounded-2xl flex items-center justify-center mb-3 2xl:mb-4 ${iconBg}`}>
                <Icon className={`w-5 h-5 2xl:w-7 2xl:h-7 ${iconColor}`} />
              </div>
              <h3 className="font-bold text-gray-900 text-base 2xl:text-xl mb-1.5 2xl:mb-3">{title}</h3>
              <p className="text-gray-500 text-sm 2xl:text-base leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </CustomerLayout>
  );
}
