import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { Layout } from "./components/Layout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdminPanelPage } from "./pages/AdminPanelPage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { AttendancePage } from "./pages/AttendancePage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Login route - redirect to / if already logged in
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

// Protected layout wrapper
function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <LoginPage />;
  }
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: ProtectedLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/",
  component: DashboardPage,
});

const attendanceRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/attendance",
  component: AttendancePage,
});

const adminRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/admin",
  component: AdminPanelPage,
});

const announcementsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/announcements",
  component: AnnouncementsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedRoute.addChildren([
    dashboardRoute,
    attendanceRoute,
    adminRoute,
    announcementsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function AppContent() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "oklch(0.14 0.018 50)",
            border: "1px solid oklch(0.22 0.025 50)",
            color: "oklch(0.94 0.01 60)",
          },
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
