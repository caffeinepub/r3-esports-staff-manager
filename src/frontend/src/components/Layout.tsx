import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@tanstack/react-router";
import { LogOut, Shield } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { getRoleColor, getRoleLabel } from "../utils/helpers";
import { NotificationBell } from "./NotificationBell";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { username, role, logout, canManageStaff } = useAuth();
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  const navItems = [
    { label: "Dashboard", path: "/" },
    { label: "Attendance", path: "/attendance" },
    ...(canManageStaff ? [{ label: "Admin Panel", path: "/admin" }] : []),
    { label: "Announcements", path: "/announcements" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gaming-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gaming-border bg-gaming-darker/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="h-9 w-9 rounded-md overflow-hidden border border-neon-peach/40"
              style={{ boxShadow: "0 0 10px oklch(0.82 0.18 38 / 0.35)" }}
            >
              <img
                src="/assets/rh3huum-019d5830-baeb-77e2-a99b-dbc4a0b7b9e9.jpeg"
                alt="R3 Esports"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="leading-none">
              <div className="font-display font-bold text-sm tracking-widest text-foreground uppercase glow-text">
                R3 ESPORTS
              </div>
              <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
                STAFF PORTAL
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                  isActive(item.path)
                    ? "nav-active shadow-neon-yellow"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
                data-ocid={`nav.${item.label.toLowerCase().replace(" ", "_")}.link`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-gaming-border">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-neon-peach/30 to-neon-amber/30 border border-neon-peach/50 flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-neon-peach" />
              </div>
              <div className="leading-none">
                <div className="text-xs font-medium text-foreground">
                  {username}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {role && getRoleLabel(role)}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Logout"
              data-ocid="nav.logout.button"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-gaming-border px-4 py-2 flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isActive(item.path)
                  ? "nav-active"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gaming-border bg-gaming-darker/80 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} R3 ESPORTS. All rights reserved.
          </span>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neon-peach transition-colors"
          >
            Built with ❤️ using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
