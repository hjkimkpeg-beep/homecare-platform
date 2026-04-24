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
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
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
