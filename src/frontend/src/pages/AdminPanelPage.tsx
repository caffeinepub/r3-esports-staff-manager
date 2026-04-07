import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  KeyRound,
  Loader2,
  Megaphone,
  Send,
  ShieldAlert,
  TrendingDown,
  UserPen,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import { AdminChangePasswordDialog } from "../components/AdminChangePasswordDialog";
import { AdminChangeUsernameDialog } from "../components/AdminChangeUsernameDialog";
import { useAuth } from "../context/AuthContext";
import {
  useAllPasswords,
  useAllUsers,
  useAnnouncements,
  useDemoteUser,
  useDemotionCandidates,
  useIssueWarning,
  useSendAnnouncement,
} from "../hooks/useQueries";
import {
  formatRelativeTime,
  getAvatarColor,
  getInitials,
  getRoleColor,
  getRoleLabel,
} from "../utils/helpers";

export function AdminPanelPage() {
  const {
    userId,
    role,
    canDemote,
    canIssueWarning,
    canViewPasswords,
    canSendAnnouncements,
    canRenameUsers,
    canChangePasswordFor,
  } = useAuth();
  const [tab, setTab] = useState(
    canSendAnnouncements ? "announcements" : "users",
  );
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [changePwTarget, setChangePwTarget] = useState<{
    id: bigint;
    username: string;
  } | null>(null);
  const [changeNameTarget, setChangeNameTarget] = useState<{
    id: bigint;
    username: string;
  } | null>(null);
  const [announcementMsg, setAnnouncementMsg] = useState("");

  const allUsersResult = useAllUsers(userId);
  const allPasswordsResult = useAllPasswords(
    userId,
    tab === "passwords" && canViewPasswords,
  );
  const demotionCandidates = useDemotionCandidates();
  const demoteUser = useDemoteUser();
  const issueWarning = useIssueWarning();
  const { data: announcements = [], isLoading: announcementsLoading } =
    useAnnouncements();
  const sendAnnouncement = useSendAnnouncement();

  const users: UserProfile[] =
    allUsersResult.data?.__kind__ === "ok" ? allUsersResult.data.ok : [];

  const passwords =
    allPasswordsResult.data?.__kind__ === "ok"
      ? allPasswordsResult.data.ok
      : [];

  const candidates = demotionCandidates.data ?? [];

  const sortedAnnouncements = [...announcements].sort((a, b) =>
    Number(b.timestamp - a.timestamp),
  );

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.role as unknown as string)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const filteredPasswords = passwords.filter((p) =>
    p.username.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDemote = async (targetId: bigint, targetUsername: string) => {
    if (!userId) return;
    if (!confirm(`Demote ${targetUsername}? This will flag them for demotion.`))
      return;
    try {
      await demoteUser.mutateAsync({ initiatorId: userId, targetId });
      toast.success(`${targetUsername} flagged for demotion.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Demote failed");
    }
  };

  const handleWarn = async (targetId: bigint, targetUsername: string) => {
    if (!userId) return;
    if (!confirm(`Issue a warning to ${targetUsername}?`)) return;
    try {
      await issueWarning.mutateAsync({ initiatorId: userId, targetId });
      toast.success(`Warning issued to ${targetUsername}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Warning failed");
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

    const order = ["owner", "seniorAdmin", "staff"];
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

  const handleSendAnnouncement = async () => {
    if (!userId || !announcementMsg.trim()) return;
    try {
      await sendAnnouncement.mutateAsync({
        userId,
        message: announcementMsg.trim(),
      });
      setAnnouncementMsg("");
      toast.success("Announcement sent to all clan members!");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to send announcement";
      if (msg.includes("Not logged in") || msg.includes("session")) {
        toast.error("Your session expired. Please log out and log back in.");
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-display font-bold text-2xl text-foreground">
          {role === "seniorAdmin" ? "Senior Admin Panel" : "Admin Panel"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {role === "seniorAdmin"
            ? "Manage clan members, send announcements, issue warnings, and demotions"
            : "Manage all clan members and credentials"}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <Tabs value={tab} onValueChange={setTab} data-ocid="admin.panel">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <TabsList className="bg-white border border-amber-200 flex-wrap h-auto gap-0.5">
              {canSendAnnouncements && (
                <TabsTrigger
                  value="announcements"
                  className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 gap-1.5"
                  data-ocid="admin.announcements.tab"
                >
                  <Megaphone className="h-3.5 w-3.5" /> Announcements
                </TabsTrigger>
              )}
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 gap-1.5"
                data-ocid="admin.users.tab"
              >
                <Users className="h-3.5 w-3.5" /> All Users
              </TabsTrigger>
              {canViewPasswords && (
                <TabsTrigger
                  value="passwords"
                  className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 gap-1.5"
                  data-ocid="admin.passwords.tab"
                >
                  <KeyRound className="h-3.5 w-3.5" /> Passwords
                </TabsTrigger>
              )}
              <TabsTrigger
                value="demotion"
                className="data-[state=active]:bg-red-100 data-[state=active]:text-red-600 gap-1.5"
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

            {tab !== "announcements" && (
              <div className="sm:ml-auto">
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white border-amber-200 w-full sm:w-52 focus:border-amber-400"
                  data-ocid="admin.search_input"
                />
              </div>
            )}
          </div>

          {/* Announcements Tab - Owners and Senior Admins */}
          {canSendAnnouncements && (
            <TabsContent value="announcements">
              <div className="space-y-4">
                {/* Composer */}
                <div className="neon-border-gradient">
                  <div className="rounded-lg bg-white border border-amber-200/60 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Megaphone className="h-4 w-4 text-amber-600" />
                      <h2 className="font-semibold text-sm text-foreground">
                        New Announcement
                      </h2>
                    </div>
                    <Textarea
                      value={announcementMsg}
                      onChange={(e) => setAnnouncementMsg(e.target.value)}
                      placeholder="Write your announcement to all clan staff..."
                      rows={4}
                      className="bg-amber-50/40 border-amber-200 resize-none focus:border-amber-400 mb-3"
                      data-ocid="admin.announcements.textarea"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {announcementMsg.length} characters
                      </span>
                      <Button
                        onClick={handleSendAnnouncement}
                        disabled={
                          !announcementMsg.trim() || sendAnnouncement.isPending
                        }
                        className="btn-gradient text-white"
                        data-ocid="admin.announcements.submit_button"
                      >
                        {sendAnnouncement.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Send Announcement
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Recent Announcements */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Recent Announcements
                  </h3>
                  {announcementsLoading ? (
                    <div
                      className="flex items-center justify-center py-12"
                      data-ocid="admin.announcements.loading_state"
                    >
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : sortedAnnouncements.length === 0 ? (
                    <div
                      className="rounded-lg bg-white border border-amber-200/60 py-12 text-center shadow-sm"
                      data-ocid="admin.announcements.empty_state"
                    >
                      <Megaphone className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-30" />
                      <p className="text-sm text-muted-foreground">
                        No announcements yet. Be the first to send one above.
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {sortedAnnouncements.map((ann, idx) => (
                        <motion.div
                          key={ann.id.toString()}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.2, delay: idx * 0.03 }}
                          className="rounded-lg bg-white border border-amber-200/60 p-5 hover:border-amber-400/60 hover:shadow-sm transition-all shadow-xs mb-3"
                          data-ocid={`admin.announcements.item.${idx + 1}`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`h-9 w-9 rounded-full ${getAvatarColor(
                                ann.authorUsername,
                              )} flex items-center justify-center shrink-0 mt-0.5`}
                            >
                              <span className="text-xs font-bold text-white">
                                {getInitials(ann.authorUsername)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="font-semibold text-sm text-foreground">
                                  {ann.authorUsername}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeTime(ann.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                                {ann.message}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </TabsContent>
          )}

          {/* All Users Tab */}
          <TabsContent value="users">
            <div className="neon-border-gradient">
              <div className="rounded-lg bg-white border border-amber-200/60 overflow-hidden shadow-sm">
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
                        <tr className="border-b border-amber-200/60 bg-amber-50/60">
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
                      <tbody className="divide-y divide-amber-100">
                        {filteredUsers.map((user, idx) => {
                          const userRoleStr = user.role as unknown as string;
                          const showDemote =
                            canDemote(userRoleStr) &&
                            user.id.toString() !== userId?.toString();
                          const showWarn =
                            canIssueWarning(userRoleStr) &&
                            user.id.toString() !== userId?.toString();
                          const showChangePw =
                            canChangePasswordFor(userRoleStr) &&
                            user.id.toString() !== userId?.toString();
                          const showRename =
                            canRenameUsers &&
                            user.id.toString() !== userId?.toString();
                          return (
                            <tr
                              key={user.id.toString()}
                              className="hover:bg-amber-50/40 transition-colors"
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
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleColor(userRoleStr)}`}
                                >
                                  {getRoleLabel(userRoleStr)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                                    user.isOnline
                                      ? "bg-green-50 text-green-700 border border-green-200"
                                      : "bg-red-50 text-red-600 border border-red-200"
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
                                    <span className="text-xs text-yellow-600">
                                      ⚠️ {user.inactivityWarnings.toString()}
                                    </span>
                                  )}
                                  {user.demotionWarning && (
                                    <span className="text-xs text-red-600 ml-1">
                                      🚨 Demotion
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
                                <div className="flex items-center gap-2 flex-wrap">
                                  {showRename && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setChangeNameTarget({
                                          id: user.id,
                                          username: user.username,
                                        })
                                      }
                                      className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors flex items-center gap-1"
                                      data-ocid={`admin.users.rename_button.${idx + 1}`}
                                    >
                                      <UserPen className="h-3.5 w-3.5" /> Rename
                                    </button>
                                  )}
                                  {showWarn && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleWarn(user.id, user.username)
                                      }
                                      disabled={issueWarning.isPending}
                                      className="text-xs text-yellow-600 hover:text-yellow-700 font-medium transition-colors flex items-center gap-1 disabled:opacity-40"
                                      data-ocid={`admin.users.warn_button.${idx + 1}`}
                                    >
                                      <AlertTriangle className="h-3.5 w-3.5" />{" "}
                                      Warn
                                    </button>
                                  )}
                                  {showDemote && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDemote(user.id, user.username)
                                      }
                                      disabled={demoteUser.isPending}
                                      className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors flex items-center gap-1 disabled:opacity-40"
                                      data-ocid={`admin.users.delete_button.${idx + 1}`}
                                    >
                                      <TrendingDown className="h-3.5 w-3.5" />{" "}
                                      Demote
                                    </button>
                                  )}
                                  {showChangePw && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setChangePwTarget({
                                          id: user.id,
                                          username: user.username,
                                        })
                                      }
                                      className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center gap-1"
                                      data-ocid={`admin.users.edit_button.${idx + 1}`}
                                    >
                                      <KeyRound className="h-3.5 w-3.5" />{" "}
                                      Change Pw
                                    </button>
                                  )}
                                </div>
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

          {/* Passwords Tab - Owners only */}
          {canViewPasswords && (
            <TabsContent value="passwords">
              <div className="mb-4 rounded-lg bg-amber-50 border border-amber-300 px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-amber-700">
                    👑 Owner Credentials View
                  </p>
                  <p className="text-xs text-amber-600/80 mt-0.5">
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

              <div className="neon-border-gradient">
                <div className="rounded-lg bg-white border border-amber-200/60 overflow-hidden shadow-sm">
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
                          <tr className="border-b border-amber-200/60 bg-amber-50/60">
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
                        <tbody className="divide-y divide-amber-100">
                          {filteredPasswords.map((p, idx) => {
                            const copyId = `${p.username}-${idx}`;
                            return (
                              <tr
                                key={copyId}
                                className="hover:bg-amber-50/40 transition-colors"
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
                                  <code className="text-xs font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
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
                                    className="p-1.5 rounded hover:bg-amber-50 text-muted-foreground hover:text-amber-600 transition-colors"
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
          )}

          {/* Demotion Candidates Tab */}
          <TabsContent value="demotion">
            <div className="neon-border-gradient">
              <div className="rounded-lg bg-white border border-amber-200/60 overflow-hidden shadow-sm">
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
                    <div className="px-4 py-3 bg-red-50 border-b border-red-200 text-sm text-red-600">
                      🚨 {candidates.length} member
                      {candidates.length > 1 ? "s" : ""} have been inactive for
                      7+ days
                    </div>
                    <table
                      className="w-full text-sm"
                      data-ocid="admin.demotion.table"
                    >
                      <thead>
                        <tr className="border-b border-amber-200/60 bg-amber-50/60">
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
                      <tbody className="divide-y divide-amber-100">
                        {candidates.map((c, idx) => (
                          <tr
                            key={c.id.toString()}
                            className="hover:bg-amber-50/40 bg-red-50/60"
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
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleColor(c.role as unknown as string)}`}
                              >
                                {getRoleLabel(c.role as unknown as string)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-red-600">
                                🚨 {c.inactivityWarnings.toString()} warnings
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {canDemote(c.role as unknown as string) ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDemote(c.id, c.username)}
                                  disabled={demoteUser.isPending}
                                  className="h-7 text-xs"
                                  data-ocid={`admin.demotion.delete_button.${idx + 1}`}
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

      {/* Admin Change Password Dialog */}
      {changePwTarget && (
        <AdminChangePasswordDialog
          targetUserId={changePwTarget.id}
          targetUsername={changePwTarget.username}
          open={changePwTarget !== null}
          onClose={() => setChangePwTarget(null)}
        />
      )}

      {/* Admin Change Username Dialog */}
      {changeNameTarget && (
        <AdminChangeUsernameDialog
          targetUserId={changeNameTarget.id}
          targetUsername={changeNameTarget.username}
          open={changeNameTarget !== null}
          onClose={() => setChangeNameTarget(null)}
        />
      )}
    </div>
  );
}
