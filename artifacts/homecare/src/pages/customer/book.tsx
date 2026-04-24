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
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";

const bookingSchema = z.object({
  roadAddress: z.string().min(1, "도로명 주소를 입력해주세요"),
  detailAddress: z.string().min(1, "상세 주소를 입력해주세요"),
  scheduledDate: z.string().min(1, "예약 날짜와 시간을 선택해주세요"),
  requestNote: z.string().optional(),
});

export default function BookPackage() {
  const [, params] = useRoute("/book/:packageId");
  const packageId = params?.packageId || "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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
    },
  });

  const onSubmit = (values: z.infer<typeof bookingSchema>) => {
    createOrderMutation.mutate(
      {
        data: {
          packageId,
          ...values,
          // For simplicity in UI, we ask for string datetime-local, ensure it's ISO
          scheduledDate: new Date(values.scheduledDate).toISOString(),
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

        <div className="bg-gray-50 border rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-1">{pkg.name}</h3>
          <p className="text-primary font-bold">{formatCurrency(pkg.basePrice)}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

            <div className="pt-4 border-t border-dashed">
              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold"
                disabled={createOrderMutation.isPending}
                data-testid="button-submit-booking"
              >
                {createOrderMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                결제 및 예약 완료
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </CustomerLayout>
  );
}
