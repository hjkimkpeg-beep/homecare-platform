import { useGetPackage, getGetPackageQueryKey } from "@workspace/api-client-react";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { Link, useRoute } from "wouter";
import { formatCurrency } from "@/lib/format";
import { Check, Minus, Clock, ShieldCheck, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PackageDetail() {
  const [, params] = useRoute("/packages/:id");
  const id = params?.id || "";

  const { data: pkg, isLoading } = useGetPackage(id, {
    query: { enabled: !!id, queryKey: getGetPackageQueryKey(id) }
  });

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CustomerLayout>
    );
  }

  if (!pkg) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Info className="w-12 h-12 mb-4 text-gray-300" />
          <p>패키지를 찾을 수 없습니다.</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="relative">
        <div className="bg-primary/5 p-6 border-b border-primary/10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h1>
          <p className="text-gray-600 text-sm leading-relaxed">{pkg.description}</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <Clock className="w-4 h-4" />
              소요시간 {pkg.estimatedMinutes}분
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <ShieldCheck className="w-4 h-4" />
              무상 A/S {pkg.asWarrantyDays}일
            </div>
          </div>
        </div>

        <div className="p-4 space-y-8 pb-28">
          {/* Tasks */}
          {pkg.tasks && pkg.tasks.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">작업 내용</h2>
              <div className="space-y-3">
                {pkg.tasks.map((task, idx) => (
                  <div key={idx} className="flex gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">
                      {idx + 1}
                    </div>
                    <p className="text-gray-700 leading-relaxed pt-0.5">{task}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Included */}
          {pkg.includedItems && pkg.includedItems.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">포함 내역</h2>
              <ul className="space-y-2">
                {pkg.includedItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Excluded */}
          {pkg.excludedItems && pkg.excludedItems.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">불포함 내역</h2>
              <ul className="space-y-2">
                {pkg.excludedItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-500">
                    <Minus className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 max-w-md w-full bg-white border-t p-4 flex items-center justify-between pb-safe">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">기본요금</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(pkg.basePrice)}</p>
          </div>
          <Link href={`/book/${pkg.id}`}>
            <Button size="lg" className="w-32 font-bold" data-testid="btn-book-now">
              예약하기
            </Button>
          </Link>
        </div>
      </div>
    </CustomerLayout>
  );
}
