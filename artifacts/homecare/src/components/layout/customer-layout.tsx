import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/auth-provider";
import { Home, ClipboardList, Wrench, User } from "lucide-react";

export function CustomerLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { href: "/", label: "홈", icon: Home },
    { href: "/orders", label: "주문내역", icon: ClipboardList },
    { href: "/as-requests", label: "A/S요청", icon: Wrench },
  ];

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col max-w-md mx-auto relative shadow-xl overflow-hidden">
      <header className="bg-white px-4 py-4 sticky top-0 z-10 border-b flex justify-between items-center">
        <h1 className="font-bold text-xl text-primary">HomeCare</h1>
        {user && (
          <div className="text-sm text-gray-500 font-medium">
            {user.name}님
          </div>
        )}
      </header>
      
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      <nav className="bg-white border-t fixed bottom-0 w-full max-w-md z-10">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <div
                  className={`flex flex-col items-center justify-center w-full h-full gap-1 cursor-pointer transition-colors ${
                    isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
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
