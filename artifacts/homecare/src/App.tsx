import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth-provider";
import NotFound from "@/pages/not-found";

// Customer Pages
import Login from "@/pages/login";
import CustomerHome from "@/pages/customer/home";
import PackageDetail from "@/pages/customer/package-detail";
import BookPackage from "@/pages/customer/book";
import CustomerOrders from "@/pages/customer/orders";
import CustomerOrderDetail from "@/pages/customer/order-detail";
import CustomerAsRequests from "@/pages/customer/as-requests";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminOrders from "@/pages/admin/orders";
import AdminOrderDetail from "@/pages/admin/order-detail";
import AdminPartners from "@/pages/admin/partners";
import AdminAsRequests from "@/pages/admin/as-requests";

// Partner Pages
import PartnerJobs from "@/pages/partner/jobs";
import PartnerJobDetail from "@/pages/partner/job-detail";
import PartnerHistory from "@/pages/partner/history";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/" component={CustomerHome} />
      <Route path="/packages/:id" component={PackageDetail} />
      <Route path="/book/:packageId" component={BookPackage} />
      <Route path="/orders" component={CustomerOrders} />
      <Route path="/orders/:id" component={CustomerOrderDetail} />
      <Route path="/as-requests" component={CustomerAsRequests} />

      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/orders/:id" component={AdminOrderDetail} />
      <Route path="/admin/partners" component={AdminPartners} />
      <Route path="/admin/as-requests" component={AdminAsRequests} />

      <Route path="/partner/jobs" component={PartnerJobs} />
      <Route path="/partner/jobs/:orderId" component={PartnerJobDetail} />
      <Route path="/partner/history" component={PartnerHistory} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
