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
import { Loader2, Wrench } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

const schema = z.object({
  phone: z.string().min(1, "전화번호를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export default function PartnerLogin() {
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
      if (user.role === "partner") setLocation("/partner/jobs");
      else if (user.role === "admin" || user.role === "operator") setLocation("/admin");
      else setLocation("/");
    }
  }, [user, isAuthLoading, setLocation]);

  const onSubmit = (values: z.infer<typeof schema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: async (data) => {
          if (data.user.role !== "partner") {
            toast({ title: "파트너 계정이 아닙니다", variant: "destructive" });
            return;
          }
          queryClient.setQueryData(getGetMeQueryKey(), data.user);
          setLocation("/partner/jobs");
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
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">파트너 로그인</h1>
          <p className="text-gray-400 text-sm mt-1">HomeCare 파트너 전용</p>
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
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500"
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
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500"
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
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                로그인
              </Button>
            </form>
          </Form>
        </div>

        <div className="mt-6 text-center space-y-3">
          <p className="text-gray-500 text-sm">아직 파트너가 아니신가요?</p>
          <Link href="/partner/register">
            <button className="w-full border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-semibold py-2.5 rounded-xl text-sm transition-colors">
              파트너 신규 가입
            </button>
          </Link>
          <div className="pt-2">
            <Link href="/admin/login">
              <span className="text-gray-500 text-sm hover:text-gray-300 cursor-pointer transition-colors">관리자로 로그인 →</span>
            </Link>
          </div>
          <Link href="/">
            <span className="text-gray-600 text-sm hover:text-gray-400 cursor-pointer transition-colors">← 고객 홈으로</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
