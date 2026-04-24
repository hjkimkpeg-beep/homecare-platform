import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth-provider";
import { useAuth } from "@/hooks/use-auth";
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

function CustomerGuard({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  if (user?.role === "partner") return <Redirect to="/partner/jobs" />;
  if (user?.role === "admin" || user?.role === "operator") return <Redirect to="/admin" />;
  return <Component />;
}

function AdminGuard({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  if (user?.role === "partner") return <Redirect to="/partner/jobs" />;
  if (user && user.role !== "admin" && user.role !== "operator") return <Redirect to="/" />;
  return <Component />;
}

function PartnerGuard({ component: Component }: { component: React.ComponentType<any> }) {
  const { user } = useAuth();
  if (user && user.role !== "partner") return <Redirect to="/" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      <Route path="/">
        {() => <CustomerGuard component={CustomerHome} />}
      </Route>
      <Route path="/packages/:id">
        {(params) => <CustomerGuard component={() => <PackageDetail />} />}
      </Route>
      <Route path="/book/:packageId">
        {(params) => <CustomerGuard component={() => <BookPackage />} />}
      </Route>
      <Route path="/orders">
        {() => <CustomerGuard component={CustomerOrders} />}
      </Route>
      <Route path="/orders/:id">
        {(params) => <CustomerGuard component={() => <CustomerOrderDetail />} />}
      </Route>
      <Route path="/as-requests">
        {() => <CustomerGuard component={CustomerAsRequests} />}
      </Route>

      <Route path="/admin">
        {() => <AdminGuard component={AdminDashboard} />}
      </Route>
      <Route path="/admin/orders">
        {() => <AdminGuard component={AdminOrders} />}
      </Route>
      <Route path="/admin/orders/:id">
        {(params) => <AdminGuard component={() => <AdminOrderDetail />} />}
      </Route>
      <Route path="/admin/partners">
        {() => <AdminGuard component={AdminPartners} />}
      </Route>
      <Route path="/admin/as-requests">
        {() => <AdminGuard component={AdminAsRequests} />}
      </Route>

      <Route path="/partner/jobs">
        {() => <PartnerGuard component={PartnerJobs} />}
      </Route>
      <Route path="/partner/jobs/:orderId">
        {(params) => <PartnerGuard component={() => <PartnerJobDetail />} />}
      </Route>
      <Route path="/partner/history">
        {() => <PartnerGuard component={PartnerHistory} />}
      </Route>

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
