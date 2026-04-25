import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, ClipboardList, Users, Wrench, LogOut, Search, Megaphone, BookOpen, Film } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/admin", label: "대시보드", icon: LayoutDashboard },
    { href: "/admin/orders", label: "주문 관리", icon: ClipboardList },
    { href: "/admin/booking-lookup", label: "예약 현황 조회", icon: Search },
    { href: "/admin/partners", label: "파트너 관리", icon: Users },
    { href: "/admin/as-requests", label: "A/S 관리", icon: Wrench },
    { href: "/admin/marketing", label: "마케팅 AI", icon: Megaphone },
    { href: "/admin/manuals", label: "서비스 매뉴얼", icon: BookOpen },
    { href: "/admin/videos", label: "동영상 관리", icon: Film },
  ];

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 2xl:w-72 bg-white border-r flex flex-col hidden md:flex h-[100dvh] sticky top-0 shrink-0">
        <div className="p-6 2xl:p-7 border-b">
          <h1 className="font-bold text-xl 2xl:text-2xl text-primary">HomeCare Admin</h1>
          {user && <p className="text-sm 2xl:text-base text-gray-500 mt-1">{user.name}님 환영합니다</p>}
        </div>
        <nav className="flex-1 p-4 2xl:p-5 space-y-1 2xl:space-y-1.5">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 2xl:py-3 rounded-md cursor-pointer transition-colors text-sm 2xl:text-base ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  data-testid={`admin-nav-${item.href.replace("/admin", "").replace("/", "") || "dashboard"}`}
                >
                  <item.icon className="w-5 h-5 2xl:w-6 2xl:h-6 shrink-0" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 2xl:p-5 border-t">
          <Button variant="ghost" className="w-full justify-start text-gray-500 hover:text-gray-900 text-sm 2xl:text-base" onClick={logout} data-testid="btn-logout">
            <LogOut className="w-5 h-5 2xl:w-6 2xl:h-6 mr-3" />
            로그아웃
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between md:hidden sticky top-0 z-10">
          <h1 className="font-bold text-lg text-primary">HomeCare Admin</h1>
          <Button variant="ghost" size="icon" onClick={logout} data-testid="btn-logout-mobile">
            <LogOut className="w-5 h-5 text-gray-500" />
          </Button>
        </header>

        {/* Mobile Nav - Scrollable horizontally */}
        <nav className="bg-white border-b px-2 py-2 flex overflow-x-auto md:hidden sticky top-[53px] z-10 whitespace-nowrap">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm cursor-pointer transition-colors flex-shrink-0 ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 2xl:p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
