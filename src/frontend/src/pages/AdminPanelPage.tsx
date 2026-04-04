import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  Copy,
  Download,
  KeyRound,
  Loader2,
  ShieldAlert,
  TrendingDown,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend.d";
import { useAuth } from "../context/AuthContext";
import {
  useAllPasswords,
  useAllUsers,
  useDemoteUser,
  useDemotionCandidates,
} from "../hooks/useQueries";
import {
  getAvatarColor,
  getInitials,
  getRoleColor,
  getRoleLabel,
} from "../utils/helpers";

export function AdminPanelPage() {
  const { userId, role, canDemote } = useAuth();
  const isOwner = role === "owner";
  const [tab, setTab] = useState("users");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const allUsersResult = useAllUsers(userId);
  const allPasswordsResult = useAllPasswords(userId, tab === "passwords");
  const demotionCandidates = useDemotionCandidates();
  const demoteUser = useDemoteUser();

  const users: UserProfile[] =
    allUsersResult.data?.__kind__ === "ok" ? allUsersResult.data.ok : [];

  const passwords =
    allPasswordsResult.data?.__kind__ === "ok"
      ? allPasswordsResult.data.ok
      : [];

  const candidates = demotionCandidates.data ?? [];

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredPasswords = passwords.filter((p) =>
    p.username.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDemote = async (targetId: bigint, targetUsername: string) => {
    if (!userId) return;
    if (!confirm(`Demote ${targetUsername}? This cannot be undone.`)) return;
    try {
      await demoteUser.mutateAsync({ initiatorId: userId, targetId });
      toast.success(`${targetUsername} demoted.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Demote failed");
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    toast.success("Copied!");
  };

  const handleExport = () => {
    const byRole: Record<string, { username: string; password: string }[]> = {};
    for (const p of passwords) {
      if (!byRole[p.role]) byRole[p.role] = [];
      byRole[p.role].push({ username: p.username, password: p.password });
    }

    const order = ["owner", "seniorAdmin", "admin", "staff"];
    let output = "=== R3 ESPORTS STAFF CREDENTIALS ===\n\n";
    for (const r of order) {
      const group = byRole[r];
      if (group?.length) {
        output += `--- ${getRoleLabel(r).toUpperCase()} ---\n`;
        for (const p of group) {
          output += `${p.username} | ${p.password}\n`;
        }
        output += "\n";
      }
    }

    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "r3esports-credentials.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Credentials exported!");
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-display font-bold text-2xl text-foreground">
          Admin Panel
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage all clan members and credentials
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <Tabs value={tab} onValueChange={setTab} data-ocid="admin.panel">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <TabsList className="bg-gaming-card border border-gaming-border">
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-neon-amber/20 data-[state=active]:text-neon-peach gap-1.5"
                data-ocid="admin.users.tab"
              >
                <Users className="h-3.5 w-3.5" /> All Users
              </TabsTrigger>
              <TabsTrigger
                value="passwords"
                className="data-[state=active]:bg-neon-amber/20 data-[state=active]:text-neon-peach gap-1.5"
                data-ocid="admin.passwords.tab"
              >
                <KeyRound className="h-3.5 w-3.5" /> Passwords
              </TabsTrigger>
              <TabsTrigger
                value="demotion"
                className="data-[state=active]:bg-red-900/30 data-[state=active]:text-red-400 gap-1.5"
                data-ocid="admin.demotion.tab"
              >
                <ShieldAlert className="h-3.5 w-3.5" /> Demotion
                {candidates.length > 0 && (
                  <span className="ml-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">
                    {candidates.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="sm:ml-auto">
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gaming-card border-gaming-border w-full sm:w-52 focus:border-neon-peach/60"
                data-ocid="admin.search_input"
              />
            </div>
          </div>

          {/* All Users Tab */}
          <TabsContent value="users">
            <div className="neon-border-gradient">
              <div className="rounded-lg bg-gaming-card border border-gaming-border overflow-hidden">
                {allUsersResult.isLoading ? (
                  <div
                    className="flex items-center justify-center py-16"
                    data-ocid="admin.users.loading_state"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : allUsersResult.data?.__kind__ === "err" ? (
                  <div
                    className="py-8 text-center text-destructive text-sm"
                    data-ocid="admin.users.error_state"
                  >
                    {allUsersResult.data.err}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div
                    className="py-12 text-center text-muted-foreground text-sm"
                    data-ocid="admin.users.empty_state"
                  >
                    No users found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table
                      className="w-full text-sm"
                      data-ocid="admin.users.table"
                    >
                      <thead>
                        <tr className="border-b border-gaming-border bg-muted/20">
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            User
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Role
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Warnings
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gaming-border/50">
                        {filteredUsers.map((user, idx) => (
                          <tr
                            key={user.id.toString()}
                            className="hover:bg-muted/10 transition-colors"
                            data-ocid={`admin.users.row.${idx + 1}`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`h-8 w-8 rounded-full ${getAvatarColor(user.username)} flex items-center justify-center shrink-0`}
                                >
                                  <span className="text-xs font-bold text-white">
                                    {getInitials(user.username)}
                                  </span>
                                </div>
                                <span className="font-medium text-foreground">
                                  {user.username}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleColor(user.role)}`}
                              >
                                {getRoleLabel(user.role)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                                  user.isOnline
                                    ? "bg-green-900/40 text-green-400 border border-green-700/50"
                                    : "bg-red-900/40 text-red-400 border border-red-700/50"
                                }`}
                              >
                                <div
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    user.isOnline
                                      ? "bg-gaming-online"
                                      : "bg-gaming-offline"
                                  }`}
                                />
                                {user.isOnline ? "Online" : "Offline"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {Number(user.inactivityWarnings) > 0 && (
                                  <span className="text-xs text-yellow-400">
                                    \u26a0\ufe0f{" "}
                                    {user.inactivityWarnings.toString()}
                                  </span>
                                )}
                                {user.demotionWarning && (
                                  <span className="text-xs text-red-400 ml-1">
                                    \ud83d\udea8 Demotion
                                  </span>
                                )}
                                {Number(user.inactivityWarnings) === 0 &&
                                  !user.demotionWarning && (
                                    <span className="text-xs text-muted-foreground">
                                      &mdash;
                                    </span>
                                  )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {canDemote(user.role) ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDemote(user.id, user.username)
                                  }
                                  disabled={demoteUser.isPending}
                                  className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors flex items-center gap-1 disabled:opacity-40"
                                  data-ocid={`admin.users.demote_button.${idx + 1}`}
                                >
                                  <TrendingDown className="h-3.5 w-3.5" />{" "}
                                  Demote
                                </button>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  &mdash;
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Passwords Tab */}
          <TabsContent value="passwords">
            {isOwner ? (
              <div className="mb-4 rounded-lg bg-yellow-900/20 border border-yellow-700/40 px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-yellow-400">
                    \ud83d\udc51 Owner Credentials View
                  </p>
                  <p className="text-xs text-yellow-400/70 mt-0.5">
                    Below are ALL account credentials. Export and distribute to
                    your staff.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleExport}
                  className="btn-gradient text-white shrink-0"
                  data-ocid="admin.passwords.export.button"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export All
                </Button>
              </div>
            ) : (
              <div className="mb-4 rounded-lg bg-orange-900/20 border border-orange-700/40 px-4 py-3">
                <p className="text-sm font-semibold text-neon-peach">
                  \ud83d\udd10 Credentials Management
                </p>
                <p className="text-xs text-neon-peach/70 mt-0.5">
                  Save and distribute these credentials to your staff members.
                </p>
              </div>
            )}

            <div className="neon-border-gradient">
              <div className="rounded-lg bg-gaming-card border border-gaming-border overflow-hidden">
                {allPasswordsResult.isLoading ? (
                  <div
                    className="flex items-center justify-center py-16"
                    data-ocid="admin.passwords.loading_state"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : allPasswordsResult.data?.__kind__ === "err" ? (
                  <div
                    className="py-8 text-center text-destructive text-sm"
                    data-ocid="admin.passwords.error_state"
                  >
                    {allPasswordsResult.data.err}
                  </div>
                ) : filteredPasswords.length === 0 ? (
                  <div
                    className="py-12 text-center text-muted-foreground text-sm"
                    data-ocid="admin.passwords.empty_state"
                  >
                    No passwords found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table
                      className="w-full text-sm"
                      data-ocid="admin.passwords.table"
                    >
                      <thead>
                        <tr className="border-b border-gaming-border bg-muted/20">
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Username
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Role
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Password
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Copy
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gaming-border/50">
                        {filteredPasswords.map((p, idx) => {
                          const copyId = `${p.username}-${idx}`;
                          return (
                            <tr
                              key={copyId}
                              className="hover:bg-muted/10 transition-colors"
                              data-ocid={`admin.passwords.row.${idx + 1}`}
                            >
                              <td className="px-4 py-3 font-medium text-foreground">
                                {p.username}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleColor(p.role)}`}
                                >
                                  {getRoleLabel(p.role)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <code className="text-xs font-mono text-neon-peach bg-neon-peach/5 px-2 py-0.5 rounded">
                                  {p.password}
                                </code>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(
                                      `${p.username} | ${p.password}`,
                                      copyId,
                                    )
                                  }
                                  className="p-1.5 rounded hover:bg-muted/40 text-muted-foreground hover:text-neon-peach transition-colors"
                                  data-ocid={`admin.passwords.copy.button.${idx + 1}`}
                                  title="Copy credentials"
                                >
                                  {copiedId === copyId ? (
                                    <Check className="h-3.5 w-3.5 text-gaming-online" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Demotion Candidates Tab */}
          <TabsContent value="demotion">
            <div className="neon-border-gradient">
              <div className="rounded-lg bg-gaming-card border border-gaming-border overflow-hidden">
                {demotionCandidates.isLoading ? (
                  <div
                    className="flex items-center justify-center py-16"
                    data-ocid="admin.demotion.loading_state"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : candidates.length === 0 ? (
                  <div
                    className="py-12 text-center"
                    data-ocid="admin.demotion.empty_state"
                  >
                    <ShieldAlert className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                    <p className="text-sm text-muted-foreground">
                      No demotion candidates. All staff are active!
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="px-4 py-3 bg-red-950/20 border-b border-red-900/30 text-sm text-red-400">
                      \ud83d\udea8 {candidates.length} member
                      {candidates.length > 1 ? "s" : ""} have been inactive for
                      7+ days
                    </div>
                    <table
                      className="w-full text-sm"
                      data-ocid="admin.demotion.table"
                    >
                      <thead>
                        <tr className="border-b border-gaming-border bg-muted/20">
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            User
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Role
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Warnings
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gaming-border/50">
                        {candidates.map((c, idx) => (
                          <tr
                            key={c.id.toString()}
                            className="hover:bg-muted/10 bg-red-950/10"
                            data-ocid={`admin.demotion.row.${idx + 1}`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`h-8 w-8 rounded-full ${getAvatarColor(c.username)} flex items-center justify-center shrink-0`}
                                >
                                  <span className="text-xs font-bold text-white">
                                    {getInitials(c.username)}
                                  </span>
                                </div>
                                <span className="font-medium text-foreground">
                                  {c.username}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleColor(c.role)}`}
                              >
                                {getRoleLabel(c.role)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-red-400">
                                \ud83d\udea8 {c.inactivityWarnings.toString()}{" "}
                                warnings
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {canDemote(c.role) ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDemote(c.id, c.username)}
                                  disabled={demoteUser.isPending}
                                  className="h-7 text-xs"
                                  data-ocid={`admin.demotion.demote_button.${idx + 1}`}
                                >
                                  <TrendingDown className="mr-1 h-3 w-3" />{" "}
                                  Demote
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  &mdash;
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
