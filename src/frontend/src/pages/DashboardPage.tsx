import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Megaphone,
  TrendingDown,
  Users,
  Wifi,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import {
  useAnnouncements,
  useAttendanceBoard,
  useCheckIn,
  useCheckOut,
  useSendAnnouncement,
} from "../hooks/useQueries";
import {
  formatRelativeTime,
  getRoleColor,
  getRoleLabel,
} from "../utils/helpers";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent: string;
  ocid: string;
}

function StatCard({ label, value, icon, accent, ocid }: StatCardProps) {
  return (
    <div
      className="rounded-lg bg-gaming-card border border-gaming-border p-4 flex items-center gap-4"
      data-ocid={ocid}
    >
      <div
        className={`h-10 w-10 rounded-lg flex items-center justify-center ${accent}`}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-display font-bold text-foreground">
          {value}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { userId, username, role, canSendAnnouncements } = useAuth();
  const { data: board = [], isLoading: boardLoading } = useAttendanceBoard();
  const { data: announcements = [], isLoading: announcementsLoading } =
    useAnnouncements();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const sendAnnouncement = useSendAnnouncement();
  const [broadcastMsg, setBroadcastMsg] = useState("");

  const myStatus = board.find((u) => u.username === username);
  const onlineCount = board.filter((u) => u.isOnline).length;
  const warningCount = board.filter(
    (u) => Number(u.inactivityDays) >= 5,
  ).length;
  const demotionCount = board.filter(
    (u) => Number(u.inactivityDays) >= 7,
  ).length;

  const handleCheckIn = async () => {
    if (!userId) return;
    try {
      await checkIn.mutateAsync(userId);
      toast.success("Checked in! You are now online.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check-in failed");
    }
  };

  const handleCheckOut = async () => {
    if (!userId) return;
    try {
      await checkOut.mutateAsync(userId);
      toast.success("Checked out. See you next time!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check-out failed");
    }
  };

  const handleBroadcast = async () => {
    if (!userId || !broadcastMsg.trim()) return;
    try {
      await sendAnnouncement.mutateAsync({
        userId,
        message: broadcastMsg.trim(),
      });
      setBroadcastMsg("");
      toast.success("Announcement sent to all staff!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send announcement",
      );
    }
  };

  const recentAnnouncements = [...announcements]
    .sort((a, b) => Number(b.timestamp - a.timestamp))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Broadcast composer */}
      {canSendAnnouncements && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="neon-border-gradient"
        >
          <div className="rounded-lg bg-gaming-card border border-gaming-border p-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Textarea
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  placeholder="Broadcast message to all clan staff..."
                  rows={2}
                  className="bg-input/40 border-gaming-border resize-none focus:border-neon-peach/60"
                  data-ocid="dashboard.broadcast.textarea"
                />
              </div>
              <Button
                onClick={handleBroadcast}
                disabled={!broadcastMsg.trim() || sendAnnouncement.isPending}
                className="btn-gradient text-white self-end px-6"
                data-ocid="dashboard.broadcast.submit_button"
              >
                {sendAnnouncement.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Megaphone className="mr-1.5 h-4 w-4" /> Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Currently Online"
          value={boardLoading ? "..." : onlineCount}
          icon={<Wifi className="h-5 w-5 text-gaming-online" />}
          accent="bg-green-900/40"
          ocid="dashboard.online_stat.card"
        />
        <StatCard
          label="Total Staff"
          value={boardLoading ? "..." : board.length}
          icon={<Users className="h-5 w-5 text-neon-peach" />}
          accent="bg-orange-900/40"
          ocid="dashboard.total_stat.card"
        />
        <StatCard
          label="Inactivity Warnings"
          value={boardLoading ? "..." : warningCount}
          icon={<AlertTriangle className="h-5 w-5 text-yellow-400" />}
          accent="bg-yellow-900/40"
          ocid="dashboard.warnings_stat.card"
        />
        <StatCard
          label="Demotion Warnings"
          value={boardLoading ? "..." : demotionCount}
          icon={<TrendingDown className="h-5 w-5 text-red-400" />}
          accent="bg-red-900/40"
          ocid="dashboard.demotion_stat.card"
        />
      </motion.div>

      {/* My Status & Announcements row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid lg:grid-cols-3 gap-6"
      >
        {/* My Status */}
        <div className="rounded-lg bg-gaming-card border border-gaming-border p-5 space-y-4">
          <h2 className="font-semibold text-sm tracking-wider text-muted-foreground uppercase">
            My Status
          </h2>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-neon-peach/30 to-neon-amber/30 border border-neon-peach/40 flex items-center justify-center">
              <span className="font-bold text-sm text-neon-peach">
                {username ? username.slice(0, 2).toUpperCase() : "?"}
              </span>
            </div>
            <div>
              <div className="font-semibold text-foreground">{username}</div>
              {role && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleColor(role)}`}
                >
                  {getRoleLabel(role)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${myStatus?.isOnline ? "bg-gaming-online" : "bg-gaming-offline"} animate-pulse-neon`}
            />
            <span
              className={`text-sm font-medium ${myStatus?.isOnline ? "text-gaming-online" : "text-gaming-offline"}`}
            >
              {myStatus?.isOnline ? "Online" : "Offline"}
            </span>
            {myStatus?.lastCheckIn && (
              <span className="text-xs text-muted-foreground ml-1">
                · {formatRelativeTime(myStatus.lastCheckIn)}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={myStatus?.isOnline || checkIn.isPending}
              onClick={handleCheckIn}
              className="flex-1 bg-green-900/50 hover:bg-green-800/60 text-green-400 border border-green-700/50 disabled:opacity-40"
              data-ocid="dashboard.checkin.button"
            >
              {checkIn.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
              )}
              Check In
            </Button>
            <Button
              size="sm"
              disabled={!myStatus?.isOnline || checkOut.isPending}
              onClick={handleCheckOut}
              className="flex-1 bg-red-900/50 hover:bg-red-800/60 text-red-400 border border-red-700/50 disabled:opacity-40"
              data-ocid="dashboard.checkout.button"
            >
              {checkOut.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
              )}
              Check Out
            </Button>
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="lg:col-span-2 rounded-lg bg-gaming-card border border-gaming-border p-5 space-y-4">
          <h2 className="font-semibold text-sm tracking-wider text-muted-foreground uppercase">
            Recent Announcements
          </h2>
          {announcementsLoading ? (
            <div
              className="flex items-center justify-center py-8"
              data-ocid="dashboard.announcements.loading_state"
            >
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : recentAnnouncements.length === 0 ? (
            <div
              className="py-8 text-center text-muted-foreground text-sm"
              data-ocid="dashboard.announcements.empty_state"
            >
              No announcements yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map((ann, idx) => (
                <div
                  key={ann.id.toString()}
                  className="rounded-md bg-muted/20 border border-gaming-border p-3"
                  data-ocid={`dashboard.announcement.item.${idx + 1}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-medium text-neon-peach">
                      {ann.authorUsername}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(ann.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {ann.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick attendance preview */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="neon-border-gradient"
      >
        <div className="rounded-lg bg-gaming-card border border-gaming-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-base text-foreground">
                Attendance Overview
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Currently Online Staff ({onlineCount}/{board.length})
              </p>
            </div>
          </div>
          {boardLoading ? (
            <div
              className="flex items-center justify-center py-8"
              data-ocid="dashboard.board.loading_state"
            >
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : board.length === 0 ? (
            <div
              className="py-8 text-center text-muted-foreground text-sm"
              data-ocid="dashboard.board.empty_state"
            >
              No staff members found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                data-ocid="dashboard.board.table"
              >
                <thead>
                  <tr className="border-b border-gaming-border">
                    <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Member
                    </th>
                    <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Last Seen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gaming-border/50">
                  {board.slice(0, 8).map((member, idx) => (
                    <tr
                      key={member.userId.toString()}
                      className="hover:bg-muted/10 transition-colors"
                      data-ocid={`dashboard.board.row.${idx + 1}`}
                    >
                      <td className="py-2.5 pr-4">
                        <span className="font-medium text-foreground">
                          {member.username}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleColor(member.role)}`}
                        >
                          {getRoleLabel(member.role)}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                            member.isOnline
                              ? "bg-green-900/40 text-green-400 border border-green-700/50"
                              : "bg-red-900/40 text-red-400 border border-red-700/50"
                          }`}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${member.isOnline ? "bg-gaming-online" : "bg-gaming-offline"}`}
                          />
                          {member.isOnline ? "Online" : "Offline"}
                        </span>
                      </td>
                      <td className="py-2.5 text-muted-foreground text-xs">
                        {formatRelativeTime(member.lastCheckIn)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
