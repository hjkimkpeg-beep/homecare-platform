import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

const schema = z.object({
  phone: z.string().min(1, "전화번호를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();
  const { user, isLoading: isAuthLoading } = useAuth();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", password: "" },
  });

  useEffect(() => {
    if (!isAuthLoading && user) {
      if (user.role === "admin" || user.role === "operator") setLocation("/admin");
      else if (user.role === "partner") setLocation("/partner/jobs");
      else setLocation("/");
    }
  }, [user, isAuthLoading, setLocation]);

  const onSubmit = (values: z.infer<typeof schema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: async (data) => {
          if (data.user.role !== "admin" && data.user.role !== "operator") {
            toast({ title: "관리자 계정이 아닙니다", variant: "destructive" });
            return;
          }
          queryClient.setQueryData(getGetMeQueryKey(), data.user);
          setLocation("/admin");
        },
        onError: () => {
          toast({ title: "로그인 실패", description: "전화번호나 비밀번호를 확인해주세요.", variant: "destructive" });
        },
      }
    );
  };

  if (isAuthLoading || user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="min-h-[100dvh] bg-[#0f1729] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">관리자 로그인</h1>
          <p className="text-gray-400 text-sm mt-1">HomeCare 관리자 전용</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm">전화번호</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="010-0000-0000"
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        {...field}
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm">비밀번호</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="비밀번호를 입력해주세요"
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        {...field}
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-xl"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                로그인
              </Button>
            </form>
          </Form>
        </div>

        <div className="mt-6 text-center space-y-2">
          <Link href="/partner/login">
            <span className="text-gray-500 text-sm hover:text-gray-300 cursor-pointer transition-colors">파트너로 로그인 →</span>
          </Link>
          <br />
          <Link href="/">
            <span className="text-gray-600 text-sm hover:text-gray-400 cursor-pointer transition-colors">← 고객 홈으로</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
