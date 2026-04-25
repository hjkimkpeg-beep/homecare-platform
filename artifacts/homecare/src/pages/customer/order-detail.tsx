import { useRoute } from "wouter";
import { useGetOrder, getGetOrderQueryKey, useCancelOrder } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { formatCurrency, getOrderStatusColor, translateOrderStatus } from "@/lib/format";
import { Loader2, MapPin, Calendar, CheckCircle2, Circle, AlertCircle, CreditCard, Banknote } from "lucide-react";
import { ShareButtons } from "@/components/share-buttons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function OrderDetail() {
  const [, params] = useRoute("/orders/:id");
  const id = params?.id || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useGetOrder(id, {
    query: { enabled: !!id, queryKey: getGetOrderQueryKey(id) }
  });

  const cancelOrderMutation = useCancelOrder();

  const handleCancel = () => {
    cancelOrderMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(id) });
          toast({ title: "주문이 취소되었습니다." });
        },
        onError: () => {
          toast({ title: "취소 실패", variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CustomerLayout>
    );
  }

  if (!order) {
    return (
      <CustomerLayout>
        <div className="p-8 text-center text-gray-500">주문을 찾을 수 없습니다.</div>
      </CustomerLayout>
    );
  }

  const isCancellable = ["requested", "paid", "pending_assignment"].includes(order.status);
  const isCompleted = order.status === "completed";

  // Simple timeline logic
  const steps = [
    { key: "requested", label: "주문접수" },
    { key: "assigned", label: "매니저 배정" },
    { key: "in_progress", label: "서비스 진행" },
    { key: "completed", label: "서비스 완료" },
  ];

  let currentStepIndex = steps.findIndex(s => s.key === order.status);
  if (order.status === "paid" || order.status === "pending_assignment") currentStepIndex = 0;
  if (order.status === "en_route" || order.status === "arrived") currentStepIndex = 1;
  if (order.status === "inspection_pending" || order.status === "inspection_approved") currentStepIndex = 2;
  if (order.status === "cancelled" || order.status === "as_requested") currentStepIndex = -1;

  return (
    <CustomerLayout>
      <div className="bg-white min-h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-gray-500">주문번호 {order.orderNumber}</span>
            <Badge className={getOrderStatusColor(order.status)} variant="outline">
              {translateOrderStatus(order.status)}
            </Badge>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{order.packageName}</h1>
        </div>

        {/* Status Timeline */}
        {order.status !== "cancelled" && (
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 -z-10"></div>
              {steps.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-2 bg-white px-2 z-0">
                    {isPassed ? (
                      <CheckCircle2 className={`w-6 h-6 ${isCurrent ? "text-primary" : "text-gray-300"}`} />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-200 fill-white" />
                    )}
                    <span className={`text-xs font-medium ${isCurrent ? "text-primary" : "text-gray-400"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-4 space-y-6">
          {/* Schedule & Address */}
          <section className="space-y-4">
            <h2 className="font-bold text-gray-900">예약 정보</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex gap-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500 mb-0.5">방문 일시</p>
                  <p className="font-medium text-gray-900">
                    {new Date(order.scheduledDate).toLocaleDateString('ko-KR', { 
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500 mb-0.5">주소</p>
                  <p className="font-medium text-gray-900">{order.roadAddress} {order.detailAddress}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Assignment Info */}
          {order.assignment && (
            <section className="space-y-4">
              <h2 className="font-bold text-gray-900">담당 매니저</h2>
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                <p className="font-bold text-primary text-lg mb-1">{order.assignment.partnerName}</p>
                <p className="text-sm text-gray-600">연락처: {order.assignment.partnerPhone}</p>
              </div>
            </section>
          )}

          {/* Payment Info */}
          <section className="space-y-4">
            <h2 className="font-bold text-gray-900">결제 정보</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">서비스 금액</span>
                <span className="font-medium">{formatCurrency(order.totalPrice)}</span>
              </div>

              {order.paymentMethod && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">결제 수단</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    order.paymentMethod === "card"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-green-50 text-green-700"
                  }`}>
                    {order.paymentMethod === "card"
                      ? <><CreditCard className="w-3 h-3" /> 카드 결제</>
                      : <><Banknote className="w-3 h-3" /> 현금 결제</>
                    }
                  </span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="font-bold text-gray-900">총 결제금액</span>
                <span className="font-bold text-primary text-lg">{formatCurrency(order.totalPrice)}</span>
              </div>

              {order.paymentMethod === "card" && order.status === "cancelled" && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-700 font-medium">카드 환불 안내</p>
                  <p className="text-xs text-blue-600 mt-0.5">취소 처리 후 3~5 영업일 이내 카드사를 통해 자동 환불됩니다.</p>
                </div>
              )}

              {order.paymentMethod === "cash" && order.refundBankName && (
                <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-100 space-y-1.5">
                  <p className="text-xs text-green-700 font-semibold">환불 계좌 정보</p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-green-700">
                    <span className="text-green-500">은행</span>
                    <span className="font-medium">{order.refundBankName}</span>
                    <span className="text-green-500">계좌번호</span>
                    <span className="font-medium">{order.refundAccountNumber}</span>
                    <span className="text-green-500">예금주</span>
                    <span className="font-medium">{order.refundAccountHolder}</span>
                  </div>
                  {order.status === "cancelled" && (
                    <p className="text-xs text-green-600 pt-1 border-t border-green-200">취소 확인 후 1~3 영업일 이내 위 계좌로 환불됩니다.</p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Actions */}
          <div className="pt-4 space-y-3">
            {isCancellable && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
                    주문 취소하기
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[320px] mx-auto rounded-xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>예약을 취소하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                      취소 후에는 복구할 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>돌아가기</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} className="bg-red-500 hover:bg-red-600 text-white">
                      {cancelOrderMutation.isPending ? "취소 중..." : "예약 취소"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {isCompleted && (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full">
                  리뷰 작성하기
                </Button>
                <Button className="w-full">
                  A/S 요청하기
                </Button>
              </div>
            )}

            {/* Share Section */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-3">
                {isCompleted ? "서비스 완료! 지인에게 HomeCare를 추천해보세요 😊" : "HomeCare를 지인에게 공유해보세요"}
              </p>
              <ShareButtons
                title="HomeCare – 집 수리, 정가제로 믿고 맡기세요"
                description="전문 파트너가 고정 가격으로 방문합니다. 추가 비용 없이 투명하게!"
                url={`${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}`}
                label="공유하기"
              />
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
