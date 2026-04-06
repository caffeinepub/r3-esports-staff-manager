import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertOctagon,
  AlertTriangle,
  Loader2,
  RefreshCw,
  TrendingDown,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import {
  useAttendanceBoard,
  useDemoteUser,
  useRunInactivityCheck,
} from "../hooks/useQueries";
import {
  formatRelativeTime,
  getAvatarColor,
  getInitials,
  getRoleColor,
  getRoleLabel,
} from "../utils/helpers";

type FilterType = "all" | "online" | "offline" | "warning" | "demotion";

export function AttendancePage() {
  const { userId, canManageStaff, canDemote } = useAuth();
  const { data: board = [], isLoading } = useAttendanceBoard();
  const demoteUser = useDemoteUser();
  const runCheck = useRunInactivityCheck();
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const filtered = board.filter((m) => {
    const matchesSearch = m.username
      .toLowerCase()
      .includes(search.toLowerCase());
    const days = Number(m.inactivityDays);
    switch (filter) {
      case "online":
        return matchesSearch && m.isOnline;
      case "offline":
        return matchesSearch && !m.isOnline;
      case "warning":
        return matchesSearch && days >= 5 && days < 7;
      case "demotion":
        return matchesSearch && days >= 7;
      default:
        return matchesSearch;
    }
  });

  const onlineCount = board.filter((m) => m.isOnline).length;

  const handleDemote = async (targetId: bigint, targetUsername: string) => {
    if (!userId) return;
    if (!confirm(`Demote ${targetUsername}? This action cannot be undone.`))
      return;
    try {
      await demoteUser.mutateAsync({ initiatorId: userId, targetId });
      toast.success(`${targetUsername} has been demoted.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to demote user");
    }
  };

  const handleRunCheck = async () => {
    try {
      await runCheck.mutateAsync();
      toast.success("Inactivity check completed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check failed");
    }
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "online", label: "Online" },
    { key: "offline", label: "Offline" },
    { key: "warning", label: "\u26a0\ufe0f Warning" },
    { key: "demotion", label: "\ud83d\udea8 Demotion" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">
            Attendance Board
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {onlineCount} of {board.length} staff currently online
          </p>
        </div>
        {canManageStaff && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunCheck}
            disabled={runCheck.isPending}
            className="border-amber-400 text-amber-700 hover:bg-amber-50 self-start sm:self-auto"
            data-ocid="attendance.run_check.button"
          >
            {runCheck.isPending ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
            )}
            Run Inactivity Check
          </Button>
        )}
      </motion.div>

      {/* Filters + search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f.key
                  ? "nav-active shadow-neon-yellow"
                  : "bg-white border border-amber-200 text-muted-foreground hover:text-foreground hover:border-amber-400"
              }`}
              data-ocid="attendance.filter.tab"
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="sm:ml-auto">
          <Input
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white border-amber-200 w-full sm:w-52 focus:border-amber-400"
            data-ocid="attendance.search_input"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="neon-border-gradient"
      >
        <div className="rounded-lg bg-white border border-amber-200/60 overflow-hidden shadow-sm">
          {isLoading ? (
            <div
              className="flex items-center justify-center py-16"
              data-ocid="attendance.table.loading_state"
            >
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="py-16 text-center text-muted-foreground"
              data-ocid="attendance.table.empty_state"
            >
              <UsersIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No staff members match this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-ocid="attendance.table">
                <thead>
                  <tr className="border-b border-amber-200/60 bg-amber-50/60">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Member
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Last Check-in
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Inactive
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Flags
                    </th>
                    {canManageStaff && (
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {filtered.map((member, idx) => {
                    const days = Number(member.inactivityDays);
                    const hasDemotion = days >= 7;
                    const hasWarning = days >= 5 && days < 7;
                    return (
                      <tr
                        key={member.userId.toString()}
                        className={`hover:bg-amber-50/40 transition-colors ${
                          hasDemotion
                            ? "bg-red-50"
                            : hasWarning
                              ? "bg-yellow-50"
                              : ""
                        }`}
                        data-ocid={`attendance.table.row.${idx + 1}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`h-8 w-8 rounded-full ${getAvatarColor(member.username)} flex items-center justify-center shrink-0`}
                            >
                              <span className="text-xs font-bold text-white">
                                {getInitials(member.username)}
                              </span>
                            </div>
                            <span className="font-medium text-foreground">
                              {member.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleColor(member.role)}`}
                          >
                            {getRoleLabel(member.role)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                              member.isOnline
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-600 border border-red-200"
                            }`}
                          >
                            <div
                              className={`h-1.5 w-1.5 rounded-full ${member.isOnline ? "bg-gaming-online" : "bg-gaming-offline"} ${member.isOnline ? "animate-pulse" : ""}`}
                            />
                            {member.isOnline ? "Online" : "Offline"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatRelativeTime(member.lastCheckIn)}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span
                            className={
                              days > 0
                                ? hasDemotion
                                  ? "text-red-600"
                                  : hasWarning
                                    ? "text-yellow-600"
                                    : "text-muted-foreground"
                                : "text-muted-foreground"
                            }
                          >
                            {days}d
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {hasWarning && (
                              <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 border border-yellow-300 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="h-3 w-3" /> Warning
                              </span>
                            )}
                            {hasDemotion && (
                              <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-300 px-2 py-0.5 rounded-full">
                                <AlertOctagon className="h-3 w-3" /> Demotion
                              </span>
                            )}
                            {!hasWarning && !hasDemotion && (
                              <span className="text-xs text-muted-foreground">
                                &mdash;
                              </span>
                            )}
                          </div>
                        </td>
                        {canManageStaff && (
                          <td className="px-4 py-3">
                            {canDemote(member.role) ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDemote(member.userId, member.username)
                                }
                                disabled={demoteUser.isPending}
                                className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors flex items-center gap-1 disabled:opacity-40"
                                data-ocid={`attendance.demote.button.${idx + 1}`}
                              >
                                <TrendingDown className="h-3.5 w-3.5" />
                                Demote
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                &mdash;
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Users</title>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
