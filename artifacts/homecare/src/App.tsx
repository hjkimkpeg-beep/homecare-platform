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
import PackagesPage from "@/pages/customer/packages";
import PackageDetail from "@/pages/customer/package-detail";
import BookPackage from "@/pages/customer/book";
import CustomerOrders from "@/pages/customer/orders";
import CustomerOrderDetail from "@/pages/customer/order-detail";
import CustomerAsRequests from "@/pages/customer/as-requests";
import BookingLookup from "@/pages/customer/booking-lookup";

// Admin Pages
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminOrders from "@/pages/admin/orders";
import AdminOrderDetail from "@/pages/admin/order-detail";
import AdminPartners from "@/pages/admin/partners";
import AdminAsRequests from "@/pages/admin/as-requests";
import AdminBookingLookup from "@/pages/admin/booking-lookup";
import AdminMarketing from "@/pages/admin/marketing";

// Partner Pages
import PartnerLogin from "@/pages/partner/login";
import PartnerRegister from "@/pages/partner/register";
import PartnerJobs from "@/pages/partner/jobs";
import PartnerJobDetail from "@/pages/partner/job-detail";
import PartnerHistory from "@/pages/partner/history";
import PartnerManuals from "@/pages/partner/manuals";
import AdminManuals from "@/pages/admin/manuals";
import AdminVideos from "@/pages/admin/videos";
import AdminBoard from "@/pages/admin/board";
import CustomerBoard from "@/pages/customer/board";
import AdminResources from "@/pages/admin/resources";
import AdminProjects from "@/pages/admin/projects";
import AdminContracts from "@/pages/admin/contracts";
import AdminSms from "@/pages/admin/sms";
import CustomerResources from "@/pages/customer/resources";

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
      {/* Shared login (customer default) */}
      <Route path="/login" component={Login} />

      {/* Role-specific login */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/partner/login" component={PartnerLogin} />
      <Route path="/partner/register" component={PartnerRegister} />

      {/* Customer */}
      <Route path="/">
        {() => <CustomerGuard component={CustomerHome} />}
      </Route>
      <Route path="/packages">
        {() => <CustomerGuard component={PackagesPage} />}
      </Route>
      <Route path="/booking-lookup" component={BookingLookup} />
      <Route path="/packages/:id">
        {() => <CustomerGuard component={() => <PackageDetail />} />}
      </Route>
      <Route path="/book/:packageId">
        {() => <CustomerGuard component={() => <BookPackage />} />}
      </Route>
      <Route path="/orders">
        {() => <CustomerGuard component={CustomerOrders} />}
      </Route>
      <Route path="/orders/:id">
        {() => <CustomerGuard component={() => <CustomerOrderDetail />} />}
      </Route>
      <Route path="/as-requests">
        {() => <CustomerGuard component={CustomerAsRequests} />}
      </Route>
      <Route path="/board">
        {() => <CustomerGuard component={CustomerBoard} />}
      </Route>
      <Route path="/resources">
        {() => <CustomerGuard component={CustomerResources} />}
      </Route>

      {/* Admin */}
      <Route path="/admin">
        {() => <AdminGuard component={AdminDashboard} />}
      </Route>
      <Route path="/admin/orders">
        {() => <AdminGuard component={AdminOrders} />}
      </Route>
      <Route path="/admin/orders/:id">
        {() => <AdminGuard component={() => <AdminOrderDetail />} />}
      </Route>
      <Route path="/admin/partners">
        {() => <AdminGuard component={AdminPartners} />}
      </Route>
      <Route path="/admin/as-requests">
        {() => <AdminGuard component={AdminAsRequests} />}
      </Route>
      <Route path="/admin/booking-lookup">
        {() => <AdminGuard component={AdminBookingLookup} />}
      </Route>
      <Route path="/admin/marketing">
        {() => <AdminGuard component={AdminMarketing} />}
      </Route>
      <Route path="/admin/manuals">
        {() => <AdminGuard component={AdminManuals} />}
      </Route>
      <Route path="/admin/videos">
        {() => <AdminGuard component={AdminVideos} />}
      </Route>
      <Route path="/admin/board">
        {() => <AdminGuard component={AdminBoard} />}
      </Route>
      <Route path="/admin/resources">
        {() => <AdminGuard component={AdminResources} />}
      </Route>
      <Route path="/admin/projects">
        {() => <AdminGuard component={AdminProjects} />}
      </Route>
      <Route path="/admin/contracts">
        {() => <AdminGuard component={AdminContracts} />}
      </Route>
      <Route path="/admin/sms">
        {() => <AdminGuard component={AdminSms} />}
      </Route>

      {/* Partner */}
      <Route path="/partner/jobs">
        {() => <PartnerGuard component={PartnerJobs} />}
      </Route>
      <Route path="/partner/jobs/:orderId">
        {() => <PartnerGuard component={() => <PartnerJobDetail />} />}
      </Route>
      <Route path="/partner/history">
        {() => <PartnerGuard component={PartnerHistory} />}
      </Route>
      <Route path="/partner/manuals">
        {() => <PartnerGuard component={PartnerManuals} />}
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
