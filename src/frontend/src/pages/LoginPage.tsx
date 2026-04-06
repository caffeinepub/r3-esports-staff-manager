import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { Crown, Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useActor } from "../hooks/useActor";

const OWNER1_USERNAME = "Owner1";
const OWNER1_PASSWORD = "Eris_Tiger_4792";

export function LoginPage() {
  const { actor } = useActor();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOwnerLoading, setIsOwnerLoading] = useState(false);
  const [error, setError] = useState("");

  const doLogin = async (u: string, p: string) => {
    if (!actor) {
      setError("System not ready. Please wait...");
      return;
    }
    setError("");
    const result = await actor.login(u.trim(), p);
    if (result.__kind__ === "ok") {
      login(result.ok.userId, u.trim(), result.ok.role);
      toast.success(`Welcome back, ${u}!`);
      navigate({ to: "/" });
    } else {
      setError(result.err || "Invalid username or password");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await doLogin(username, password);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOwnerQuickLogin = async () => {
    setIsOwnerLoading(true);
    try {
      await doLogin(OWNER1_USERNAME, OWNER1_PASSWORD);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again.",
      );
    } finally {
      setIsOwnerLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background px-4"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 50% 0%, oklch(0.90 0.08 82 / 0.40) 0%, transparent 65%), radial-gradient(ellipse at 80% 80%, oklch(0.92 0.06 88 / 0.25) 0%, transparent 60%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* Logo area */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="h-20 w-20 rounded-xl border-2 border-amber-400/70 overflow-hidden mb-4"
            style={{
              boxShadow:
                "0 0 24px oklch(0.68 0.16 82 / 0.40), 0 0 60px oklch(0.82 0.18 88 / 0.15)",
            }}
          >
            <img
              src="/assets/rh3huum-019d5830-baeb-77e2-a99b-dbc4a0b7b9e9.jpeg"
              alt="R3 Esports"
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="font-display font-bold text-2xl tracking-widest uppercase text-foreground glow-text">
            R3 ESPORTS
          </h1>
          <p className="text-sm tracking-[0.3em] text-muted-foreground uppercase mt-1">
            ESPORTS STAFF PORTAL
          </p>
        </div>

        {/* Quick Owner Login Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleOwnerQuickLogin}
            disabled={isOwnerLoading || !actor}
            className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-amber-500 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm py-3 px-4 tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            style={{
              boxShadow: "0 0 16px oklch(0.68 0.16 82 / 0.30)",
            }}
            data-ocid="login.owner1_quick_button"
          >
            {isOwnerLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
            {isOwnerLoading ? "Signing in..." : "Login as Owner (1st Joiner)"}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gaming-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-widest">
            or
          </span>
          <div className="flex-1 h-px bg-gaming-border" />
        </div>

        {/* Card */}
        <div className="neon-border-gradient">
          <div className="rounded-lg bg-white border border-amber-200/60 p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="username"
                  className="text-xs tracking-wider text-muted-foreground uppercase"
                >
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                  className="bg-amber-50/50 border-amber-200 focus:border-amber-400 focus:ring-amber-300/30"
                  data-ocid="login.input"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-xs tracking-wider text-muted-foreground uppercase"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="bg-amber-50/50 border-amber-200 focus:border-amber-400 focus:ring-amber-300/30 pr-10"
                    data-ocid="login.password_input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive"
                  data-ocid="login.error_state"
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !actor}
                className="w-full btn-gradient text-white font-semibold tracking-wide transition-all"
                data-ocid="login.submit_button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing
                    In...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" /> SIGN IN
                  </>
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Contact an Owner to get your credentials.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
