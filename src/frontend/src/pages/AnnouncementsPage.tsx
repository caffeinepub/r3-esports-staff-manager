import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Megaphone, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useAnnouncements, useSendAnnouncement } from "../hooks/useQueries";
import {
  formatRelativeTime,
  getAvatarColor,
  getInitials,
  getRoleColor,
  getRoleLabel,
} from "../utils/helpers";

export function AnnouncementsPage() {
  const { userId, canSendAnnouncements } = useAuth();
  const { data: announcements = [], isLoading } = useAnnouncements();
  const sendAnnouncement = useSendAnnouncement();
  const [message, setMessage] = useState("");

  const sorted = [...announcements].sort((a, b) =>
    Number(b.timestamp - a.timestamp),
  );

  const handleSend = async () => {
    if (!userId || !message.trim()) return;
    try {
      await sendAnnouncement.mutateAsync({ userId, message: message.trim() });
      setMessage("");
      toast.success("Announcement sent to all clan members!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send announcement",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-display font-bold text-2xl text-foreground">
          Announcements
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {canSendAnnouncements
            ? "Compose and send announcements to all clan staff"
            : "Clan-wide announcements from staff management"}
        </p>
      </motion.div>

      {/* Composer */}
      {canSendAnnouncements && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="neon-border-gradient"
        >
          <div className="rounded-lg bg-white border border-amber-200/60 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="h-4 w-4 text-amber-600" />
              <h2 className="font-semibold text-sm text-foreground">
                New Announcement
              </h2>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your announcement to all clan staff..."
              rows={4}
              className="bg-amber-50/40 border-amber-200 resize-none focus:border-amber-400 mb-3"
              data-ocid="announcements.compose.textarea"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {message.length} characters
              </span>
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendAnnouncement.isPending}
                className="btn-gradient text-white"
                data-ocid="announcements.compose.submit_button"
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
        </motion.div>
      )}

      {/* Feed */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-3"
      >
        {isLoading ? (
          <div
            className="flex items-center justify-center py-16"
            data-ocid="announcements.feed.loading_state"
          >
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sorted.length === 0 ? (
          <div
            className="rounded-lg bg-white border border-amber-200/60 py-16 text-center shadow-sm"
            data-ocid="announcements.feed.empty_state"
          >
            <Megaphone className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">
              No announcements yet.
            </p>
            {canSendAnnouncements && (
              <p className="text-xs text-muted-foreground mt-1">
                Be the first to send one above.
              </p>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sorted.map((ann, idx) => (
              <motion.div
                key={ann.id.toString()}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className="rounded-lg bg-white border border-amber-200/60 p-5 hover:border-amber-400/60 hover:shadow-sm transition-all shadow-xs"
                data-ocid={`announcements.feed.item.${idx + 1}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-9 w-9 rounded-full ${getAvatarColor(ann.authorUsername)} flex items-center justify-center shrink-0 mt-0.5`}
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
      </motion.div>
    </div>
  );
}
