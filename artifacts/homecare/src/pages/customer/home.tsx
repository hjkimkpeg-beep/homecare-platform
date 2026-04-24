import { useListPackages, useListOrders } from "@workspace/api-client-react";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { Link } from "wouter";
import { formatCurrency, translateOrderStatus } from "@/lib/format";
import {
  ChevronRight,
  Clock,
  ShieldCheck,
  Loader2,
  Zap,
  Heart,
  Leaf,
  KeyRound,
  CalendarCheck,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const PACKAGE_THEMES: Record<string, { icon: React.ElementType; gradient: string; accent: string }> = {
  "90분 퀵픽스":   { icon: Zap,         gradient: "from-blue-500 to-indigo-600",   accent: "bg-blue-50 text-blue-700" },
  "시니어 안심":   { icon: Heart,        gradient: "from-rose-500 to-pink-600",     accent: "bg-rose-50 text-rose-700" },
  "에너지 세이브": { icon: Leaf,         gradient: "from-emerald-500 to-teal-600",  accent: "bg-emerald-50 text-emerald-700" },
  "임대 턴오버":   { icon: KeyRound,     gradient: "from-violet-500 to-purple-600", accent: "bg-violet-50 text-violet-700" },
  "계절 점검":     { icon: CalendarCheck, gradient: "from-amber-500 to-orange-500",  accent: "bg-amber-50 text-amber-700" },
};

const DEFAULT_THEME = { icon: Wrench, gradient: "from-gray-500 to-gray-600", accent: "bg-gray-50 text-gray-700" };

const STATS = [
  { label: "누적 완료", value: "2,400+", icon: Star },
  { label: "고객 만족", value: "4.9점", icon: Heart },
  { label: "전문 기사", value: "120명", icon: Users },
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
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-5 pt-7 pb-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full mb-3 backdrop-blur-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            전문 교육 이수 매니저 방문
          </span>
          <h2 className="text-2xl font-bold text-white leading-tight mb-1">
            어떤 서비스가<br />필요하신가요?
          </h2>
          <p className="text-blue-100 text-sm">당일 예약, 정찰제 가격</p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="mx-4 -mt-5 bg-white rounded-2xl shadow-lg border border-gray-100 px-4 py-3 flex justify-around z-10 relative">
        {STATS.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <Icon className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-bold text-gray-900">{value}</span>
            </div>
            <span className="text-[10px] text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {/* Active Order Banner */}
        {!isOrdersLoading && activeOrder && (
          <Link href={`/orders/${activeOrder.id}`}>
            <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-4 flex items-center justify-between shadow-md cursor-pointer">
              <div>
                <span className="inline-block text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full mb-1.5">
                  {translateOrderStatus(activeOrder.status)}
                </span>
                <p className="font-bold text-white">{activeOrder.packageName}</p>
                <p className="text-xs text-blue-100 mt-0.5">
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
        )}

        {/* Section header */}
        <div className="pt-1">
          <h3 className="text-base font-bold text-gray-900">서비스 패키지</h3>
          <p className="text-xs text-gray-400 mt-0.5">투명한 정찰제 · A/S 보증</p>
        </div>

        {/* Package Cards */}
        {isPackagesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {packages?.map((pkg) => {
              const theme = PACKAGE_THEMES[pkg.name] ?? DEFAULT_THEME;
              const Icon = theme.icon;
              return (
                <Link key={pkg.id} href={`/packages/${pkg.id}`}>
                  <div
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
                    data-testid={`package-card-${pkg.id}`}
                  >
                    <div className="flex items-stretch">
                      {/* Color bar + icon */}
                      <div className={`bg-gradient-to-b ${theme.gradient} w-1.5 flex-shrink-0`} />
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${theme.accent}`}>
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-gray-900 text-base leading-tight">{pkg.name}</h3>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{pkg.description}</p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className="font-bold text-primary text-base">{formatCurrency(pkg.basePrice)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-gray-50">
                          <div className="flex items-center gap-1 text-[11px] text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>약 {pkg.estimatedMinutes}분</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-gray-400">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>A/S {pkg.asWarrantyDays}일 보장</span>
                          </div>
                          <div className="ml-auto">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${theme.accent}`}>
                              예약하기
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-[11px] text-gray-300 pb-2">
          모든 서비스는 배상책임보험이 적용됩니다
        </p>
      </div>
    </CustomerLayout>
  );
}
