import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Layout } from "./components/Layout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useActor } from "./hooks/useActor";
import { AdminPanelPage } from "./pages/AdminPanelPage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { AttendancePage } from "./pages/AttendancePage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Login route
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

/**
 * Validates the backend session on mount.
 * If the backend session is gone (e.g. after a canister redeploy),
 * it automatically re-establishes the session using stored credentials.
 * Only falls back to logout() if re-login also fails.
 */
function SessionValidator() {
  const { isAuthenticated, logout, login, getStoredCredentials } = useAuth();
  const { actor, isFetching } = useActor();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    if (isFetching || !actor || !isAuthenticated) return;

    checkedRef.current = true;

    actor
      .getCurrentUser()
      .then(async (user) => {
        if (user === null || user === undefined) {
          // Session is gone on the backend — try to auto-relogin
          const creds = getStoredCredentials();
          if (creds) {
            try {
              const result = await actor.login(creds.username, creds.password);
              if (result.__kind__ === "ok") {
                // Re-establish the auth state with fresh data from backend
                login(
                  result.ok.userId,
                  creds.username,
                  result.ok.role,
                  creds.password,
                );
                // Session restored silently — no need to log out
                return;
              }
            } catch {
              // Re-login attempt failed
            }
          }
          // No stored creds or re-login failed — force logout
          logout();
        }
      })
      .catch(() => {
        // If the call itself errors, try auto-relogin before giving up
        const creds = getStoredCredentials();
        if (creds) {
          actor
            .login(creds.username, creds.password)
            .then((result) => {
              if (result.__kind__ === "ok") {
                login(
                  result.ok.userId,
                  creds.username,
                  result.ok.role,
                  creds.password,
                );
              } else {
                logout();
              }
            })
            .catch(() => logout());
        } else {
          logout();
        }
      });
  }, [actor, isFetching, isAuthenticated, logout, login, getStoredCredentials]);

  return null;
}

function AppContent() {
  return (
    <>
      <SessionValidator />
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
