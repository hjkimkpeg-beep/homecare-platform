import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Home, ClipboardList, Wrench, KeyRound } from "lucide-react";

export function CustomerLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/", label: "홈", icon: Home },
    { href: "/orders", label: "주문내역", icon: ClipboardList },
    { href: "/as-requests", label: "A/S요청", icon: Wrench },
  ];

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#0f1729] px-6 py-4 sticky top-0 z-20 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">HomeCare</span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          <Link href="/">
            <span className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              location === "/" || location.startsWith("/packages") || location.startsWith("/book") || location.startsWith("/orders") || location.startsWith("/as-requests")
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white"
            }`}>고객</span>
          </Link>
          <Link href="/admin">
            <span className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors cursor-pointer">관리자</span>
          </Link>
          <Link href="/partner/jobs">
            <span className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors cursor-pointer">파트너</span>
          </Link>
          {user && (
            <button
              onClick={logout}
              className="ml-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              {user.name}님
            </button>
          )}
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="bg-white border-t fixed bottom-0 w-full z-10 md:hidden">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <div
                  className={`flex flex-col items-center justify-center w-full h-full gap-1 cursor-pointer transition-colors ${
                    isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                  }`}
                  data-testid={`nav-${item.href.replace("/", "") || "home"}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
