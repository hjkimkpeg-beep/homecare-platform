import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRoute, useLocation } from "wouter";
import { useGetPackage, getGetPackageQueryKey, useCreateOrder } from "@workspace/api-client-react";
import { CustomerLayout } from "@/components/layout/customer-layout";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Banknote, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useState } from "react";

const BANKS = [
  "국민은행", "신한은행", "우리은행", "하나은행", "기업은행", "농협은행",
  "카카오뱅크", "토스뱅크", "케이뱅크", "SC제일은행", "씨티은행",
  "부산은행", "대구은행", "경남은행", "광주은행", "전북은행",
  "새마을금고", "우체국", "신협", "저축은행", "기타",
];

const bookingSchema = z.object({
  roadAddress: z.string().min(1, "도로명 주소를 입력해주세요"),
  detailAddress: z.string().min(1, "상세 주소를 입력해주세요"),
  scheduledDate: z.string().min(1, "예약 날짜와 시간을 선택해주세요"),
  requestNote: z.string().optional(),
  paymentMethod: z.enum(["card", "cash"]),
  refundBankName: z.string().optional(),
  refundAccountNumber: z.string().optional(),
  refundAccountHolder: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.paymentMethod === "cash") {
    if (!data.refundBankName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "환불 은행을 선택해주세요", path: ["refundBankName"] });
    }
    if (!data.refundAccountNumber) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "환불 계좌번호를 입력해주세요", path: ["refundAccountNumber"] });
    }
    if (!data.refundAccountHolder) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "예금주명을 입력해주세요", path: ["refundAccountHolder"] });
    }
  }
});

export default function BookPackage() {
  const [, params] = useRoute("/book/:packageId");
  const packageId = params?.packageId || "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showRefundInfo, setShowRefundInfo] = useState(false);

  const { data: pkg, isLoading: isPkgLoading } = useGetPackage(packageId, {
    query: { enabled: !!packageId, queryKey: getGetPackageQueryKey(packageId) }
  });

  const createOrderMutation = useCreateOrder();

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      roadAddress: "",
      detailAddress: "",
      scheduledDate: "",
      requestNote: "",
      paymentMethod: "card",
      refundBankName: "",
      refundAccountNumber: "",
      refundAccountHolder: "",
    },
  });

  const paymentMethod = form.watch("paymentMethod");

  const onSubmit = (values: z.infer<typeof bookingSchema>) => {
    createOrderMutation.mutate(
      {
        data: {
          packageId,
          roadAddress: values.roadAddress,
          detailAddress: values.detailAddress,
          scheduledDate: new Date(values.scheduledDate).toISOString(),
          requestNote: values.requestNote || undefined,
          paymentMethod: values.paymentMethod,
          refundBankName: values.paymentMethod === "cash" ? values.refundBankName : undefined,
          refundAccountNumber: values.paymentMethod === "cash" ? values.refundAccountNumber : undefined,
          refundAccountHolder: values.paymentMethod === "cash" ? values.refundAccountHolder : undefined,
        }
      },
      {
        onSuccess: (order) => {
          toast({
            title: "예약이 완료되었습니다.",
            description: "담당자가 확인 후 연락드리겠습니다.",
          });
          setLocation(`/orders/${order.id}`);
        },
        onError: () => {
          toast({
            title: "예약 실패",
            description: "다시 시도해주세요.",
            variant: "destructive",
          });
        }
      }
    );
  };

  if (isPkgLoading || !pkg) {
    return (
      <CustomerLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="p-4 pb-24">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">예약 정보 입력</h1>
          <p className="text-sm text-gray-500">정확한 서비스 제공을 위해 정보를 입력해주세요.</p>
        </div>

        {/* Package Summary */}
        <div className="bg-gray-50 border rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">서비스 예약</p>
          </div>
          <p className="text-lg font-extrabold text-gray-900">{formatCurrency(pkg.basePrice)}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* Address */}
            <FormField
              control={form.control}
              name="roadAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>도로명 주소</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 서울특별시 강남구 테헤란로 123" {...field} data-testid="input-road-address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="detailAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상세 주소</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 101동 202호" {...field} data-testid="input-detail-address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>방문 희망 일시</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} data-testid="input-scheduled-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>요청사항 (선택)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="매니저님께 전달할 내용이 있다면 적어주세요."
                      className="resize-none h-24"
                      {...field}
                      data-testid="input-request-note"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── 결제 수단 ── */}
            <div className="pt-2">
              <p className="text-sm font-semibold text-gray-700 mb-3">결제 수단</p>
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-3" data-testid="payment-method-selector">
                        {/* 카드 */}
                        <button
                          type="button"
                          onClick={() => field.onChange("card")}
                          data-testid="payment-card"
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            field.value === "card"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <CreditCard className={`w-6 h-6 ${field.value === "card" ? "text-blue-500" : "text-gray-400"}`} />
                          <span className={`text-sm font-semibold ${field.value === "card" ? "text-blue-600" : "text-gray-600"}`}>
                            카드 결제
                          </span>
                          <span className="text-xs text-gray-400">신용/체크카드</span>
                        </button>

                        {/* 현금 */}
                        <button
                          type="button"
                          onClick={() => field.onChange("cash")}
                          data-testid="payment-cash"
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            field.value === "cash"
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <Banknote className={`w-6 h-6 ${field.value === "cash" ? "text-green-500" : "text-gray-400"}`} />
                          <span className={`text-sm font-semibold ${field.value === "cash" ? "text-green-600" : "text-gray-600"}`}>
                            현금 결제
                          </span>
                          <span className="text-xs text-gray-400">현장 직접 납부</span>
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 카드 안내 */}
              {paymentMethod === "card" && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-700">
                    카드 결제는 서비스 완료 후 처리됩니다. 취소 시 자동으로 카드 환불이 진행됩니다.
                  </p>
                </div>
              )}

              {/* 현금 결제 - 환불 계좌 */}
              {paymentMethod === "cash" && (
                <div className="mt-3 space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-xs text-green-700">
                      현금 결제는 서비스 완료 후 현장에서 납부합니다. 취소 시 아래 계좌로 환불이 진행됩니다.
                    </p>
                  </div>

                  {/* 환불 계좌 섹션 */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowRefundInfo((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-700"
                    >
                      <span>환불 계좌 정보 입력 <span className="text-red-500">*</span></span>
                      {showRefundInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {(showRefundInfo || true) && (
                      <div className="p-4 space-y-4 bg-white">
                        <FormField
                          control={form.control}
                          name="refundBankName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>은행 선택</FormLabel>
                              <FormControl>
                                <select
                                  {...field}
                                  data-testid="select-refund-bank"
                                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                  <option value="">은행을 선택해주세요</option>
                                  {BANKS.map((bank) => (
                                    <option key={bank} value={bank}>{bank}</option>
                                  ))}
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="refundAccountNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>계좌번호</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="숫자만 입력 (예: 1234567890)"
                                  {...field}
                                  data-testid="input-refund-account-number"
                                  inputMode="numeric"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="refundAccountHolder"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>예금주명</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="예금주 성함을 입력해주세요"
                                  {...field}
                                  data-testid="input-refund-account-holder"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-dashed">
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-sm text-gray-500">총 결제금액</span>
                <span className="text-xl font-extrabold text-gray-900">{formatCurrency(pkg.basePrice)}</span>
              </div>
              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold"
                disabled={createOrderMutation.isPending}
                data-testid="button-submit-booking"
              >
                {createOrderMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {paymentMethod === "card" ? "카드 결제 및 예약 완료" : "현금 예약 완료"}
              </Button>
              <p className="text-xs text-center text-gray-400 mt-3">
                예약 완료 후 취소 시 환불이 가능합니다
              </p>
            </div>
          </form>
        </Form>
      </div>
    </CustomerLayout>
  );
}
