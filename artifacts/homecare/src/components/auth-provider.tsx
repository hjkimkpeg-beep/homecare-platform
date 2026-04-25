import { createContext, ReactNode } from "react";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";
import type { User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useGetMe({
    query: { retry: false }
  });

  const logoutMutation = useLogout();

  const handleLogout = () => {
    const role = user?.role;
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        if (role === "admin" || role === "operator") {
          window.location.href = "/admin/login";
        } else if (role === "partner") {
          window.location.href = "/partner/login";
        } else {
          window.location.href = "/";
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}
