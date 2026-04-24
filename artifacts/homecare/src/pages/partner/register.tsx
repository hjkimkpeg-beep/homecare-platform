import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wrench, CheckCircle2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const schema = z.object({
  name: z.string().min(2, "이름은 2자 이상 입력해주세요"),
  phone: z.string().min(10, "올바른 전화번호를 입력해주세요"),
  email: z.string().email("올바른 이메일을 입력해주세요").optional().or(z.literal("")),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  passwordConfirm: z.string().min(1, "비밀번호 확인을 입력해주세요"),
  businessType: z.enum(["individual", "business"]),
  serviceArea: z.string().min(2, "서비스 지역을 입력해주세요"),
  experienceYears: z.coerce.number().min(0).max(50),
  career: z.string().min(10, "경력을 10자 이상 입력해주세요"),
  certifications: z.string().optional(),
}).refine((d) => d.password === d.passwordConfirm, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["passwordConfirm"],
});

type FormValues = z.infer<typeof schema>;

export default function PartnerRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
      passwordConfirm: "",
      businessType: "individual",
      serviceArea: "",
      experienceYears: 0,
      career: "",
      certifications: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/register/partner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: values.name,
          phone: values.phone,
          email: values.email || undefined,
          password: values.password,
          businessType: values.businessType,
          serviceArea: values.serviceArea,
          career: values.career,
          certifications: values.certifications || undefined,
          experienceYears: values.experienceYears,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({ title: "가입 실패", description: err.error || "다시 시도해주세요.", variant: "destructive" });
        return;
      }

      setDone(true);
    } catch {
      toast({ title: "네트워크 오류", description: "잠시 후 다시 시도해주세요.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[100dvh] bg-[#0f1729] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-3">가입 신청 완료!</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            가입 신청이 접수되었습니다.<br />
            관리자 심사 후 승인 결과를 전화번호로 안내드립니다.<br />
            심사는 영업일 기준 1~3일 소요됩니다.
          </p>
          <Link href="/partner/login">
            <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors">
              파트너 로그인으로 이동
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0f1729] py-10 px-4">
      <div className="w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">파트너 신규 가입</h1>
          <p className="text-gray-400 text-sm mt-1">신청 후 관리자 심사를 거쳐 승인됩니다</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Section: 기본 정보 */}
              <div>
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-4">기본 정보</p>
                <div className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm">이름 *</FormLabel>
                      <FormControl>
                        <Input placeholder="홍길동" className="bg-white/10 border-white/20 text-white placeholder:text-gray-500" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm">전화번호 *</FormLabel>
                      <FormControl>
                        <Input placeholder="01012345678" className="bg-white/10 border-white/20 text-white placeholder:text-gray-500" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm">이메일 (선택)</FormLabel>
                      <FormControl>
                        <Input placeholder="example@email.com" className="bg-white/10 border-white/20 text-white placeholder:text-gray-500" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm">비밀번호 * (8자 이상)</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="비밀번호 입력" className="bg-white/10 border-white/20 text-white placeholder:text-gray-500" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="passwordConfirm" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm">비밀번호 확인 *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="비밀번호 재입력" className="bg-white/10 border-white/20 text-white placeholder:text-gray-500" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Section: 사업자 유형 */}
              <div>
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-4">사업자 유형</p>
                <FormField control={form.control} name="businessType" render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: "individual", label: "개인" },
                        { value: "business", label: "사업자" },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={`py-3 rounded-xl text-sm font-semibold border transition-colors ${
                            field.value === opt.value
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "bg-white/5 border-white/20 text-gray-400 hover:bg-white/10"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )} />
              </div>

              {/* Section: 전문 정보 */}
              <div>
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-4">전문 정보</p>
                <div className="space-y-4">
                  <FormField control={form.control} name="serviceArea" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm">서비스 가능 지역 *</FormLabel>
                      <FormControl>
                        <Input placeholder="예: 서울 강남구, 서초구" className="bg-white/10 border-white/20 text-white placeholder:text-gray-500" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="experienceYears" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm">경력 연수 *</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={50} placeholder="0" className="bg-white/10 border-white/20 text-white placeholder:text-gray-500" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="career" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm">경력 소개 *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="이전 직장, 주요 수행 업무, 전문 분야 등을 자유롭게 입력해주세요."
                          rows={4}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="certifications" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm">보유 자격증 (선택)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="예: 전기기능사, 배관기능사, 실내건축기능사 등"
                          rows={3}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )} />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl"
                disabled={isLoading}
                data-testid="button-register"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                가입 신청하기
              </Button>
            </form>
          </Form>
        </div>

        <div className="mt-6 text-center">
          <Link href="/partner/login">
            <span className="text-gray-500 text-sm hover:text-gray-300 cursor-pointer transition-colors">← 파트너 로그인으로 돌아가기</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
