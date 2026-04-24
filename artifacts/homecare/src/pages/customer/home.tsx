import { useListPackages, useListOrders } from "@workspace/api-client-react";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { Link } from "wouter";
import { formatCurrency, getOrderStatusColor, translateOrderStatus } from "@/lib/format";
import { ChevronRight, Clock, ShieldCheck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

export default function CustomerHome() {
  const { user } = useAuth();
  const { data: packages, isLoading: isPackagesLoading } = useListPackages();
  const { data: orders, isLoading: isOrdersLoading } = useListOrders(
    { status: "in_progress" }, 
    { query: { enabled: !!user } }
  );

  const activeOrder = orders?.[0];

  return (
    <CustomerLayout>
      <div className="p-4 space-y-6">
        {/* Active Order Banner */}
        {!isOrdersLoading && activeOrder && (
          <Link href={`/orders/${activeOrder.id}`}>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between cursor-pointer" data-testid="active-order-banner">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getOrderStatusColor(activeOrder.status)} variant="outline">
                    {translateOrderStatus(activeOrder.status)}
                  </Badge>
                  <span className="text-sm font-bold text-primary">진행중인 작업이 있습니다</span>
                </div>
                <h3 className="font-semibold text-gray-900">{activeOrder.packageName}</h3>
                <p className="text-xs text-gray-500 mt-1">{new Date(activeOrder.scheduledDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <ChevronRight className="text-primary w-5 h-5" />
            </div>
          </Link>
        )}

        {/* Hero Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">어떤 서비스가 필요하신가요?</h2>
          <p className="text-gray-500 text-sm">전문 교육을 받은 매니저가 방문합니다</p>
        </div>

        {/* Package List */}
        {isPackagesLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {packages?.map((pkg) => (
              <Link key={pkg.id} href={`/packages/${pkg.id}`}>
                <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" data-testid={`package-card-${pkg.id}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-900">{pkg.name}</h3>
                    <span className="font-bold text-primary">{formatCurrency(pkg.basePrice)}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{pkg.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>약 {pkg.estimatedMinutes}분 소요</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>A/S {pkg.asWarrantyDays}일 보장</span>
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
