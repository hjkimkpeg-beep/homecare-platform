import { useListAsRequests } from "@workspace/api-client-react";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { translateAsRequestStatus } from "@/lib/format";
import { Loader2, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AsRequests() {
  const { data: requests, isLoading } = useListAsRequests();

  return (
    <CustomerLayout>
      <div className="p-4">
        <h1 className="text-xl font-bold text-gray-900 mb-4">A/S 요청 내역</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !requests || requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Wrench className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">요청하신 A/S 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="bg-white border rounded-xl p-4 shadow-sm" data-testid={`as-card-${req.id}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{req.reason}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(req.createdAt).toLocaleDateString('ko-KR', { 
                        year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <Badge variant={req.status === "completed" ? "default" : "outline"} className="bg-gray-100 text-gray-800">
                    {translateAsRequestStatus(req.status)}
                  </Badge>
                </div>
                {req.description && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {req.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
