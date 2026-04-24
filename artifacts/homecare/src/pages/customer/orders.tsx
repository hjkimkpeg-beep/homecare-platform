import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { Link } from "wouter";
import { formatCurrency, getOrderStatusColor, translateOrderStatus } from "@/lib/format";
import { Loader2, ChevronRight, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CustomerOrders() {
  const { data: orders, isLoading } = useListOrders();

  return (
    <CustomerLayout>
      <div className="p-4">
        <h1 className="text-xl font-bold text-gray-900 mb-4">내 주문내역</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">아직 주문 내역이 없습니다.</p>
            <Link href="/">
              <span className="text-primary text-sm mt-2 cursor-pointer hover:underline">서비스 둘러보기</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" data-testid={`order-card-${order.id}`}>
                  <div className="flex justify-between items-center mb-3 border-b pb-3">
                    <span className="text-sm font-medium text-gray-500">주문번호 {order.orderNumber}</span>
                    <Badge className={getOrderStatusColor(order.status)} variant="outline">
                      {translateOrderStatus(order.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900">{order.packageName}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(order.scheduledDate).toLocaleDateString('ko-KR', { 
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <div className="flex items-center text-primary font-bold">
                      {formatCurrency(order.totalPrice)}
                      <ChevronRight className="w-5 h-5 ml-1 text-gray-400" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
