import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useLogin, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";

const loginSchema = z.object({
  phone: z.string().min(1, "전화번호를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();
  const { user, isLoading: isAuthLoading } = useAuth();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!isAuthLoading && user) {
      if (user.role === "admin" || user.role === "operator") {
        setLocation("/admin");
      } else if (user.role === "partner") {
        setLocation("/partner/jobs");
      } else {
        setLocation("/");
      }
    }
  }, [user, isAuthLoading, setLocation]);

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: async (data) => {
          queryClient.setQueryData(getGetMeQueryKey(), data.user);
          if (data.user.role === "admin" || data.user.role === "operator") {
            setLocation("/admin");
          } else if (data.user.role === "partner") {
            setLocation("/partner/jobs");
          } else {
            setLocation("/");
          }
        },
        onError: () => {
          toast({
            title: "로그인 실패",
            description: "전화번호나 비밀번호를 확인해주세요.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isAuthLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2">HomeCare</h1>
          <p className="text-gray-500 text-sm">전문적인 홈케어 서비스를 경험하세요</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>전화번호</FormLabel>
                  <FormControl>
                    <Input placeholder="01012345678" {...field} data-testid="input-phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="비밀번호를 입력해주세요" {...field} data-testid="input-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              로그인
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
