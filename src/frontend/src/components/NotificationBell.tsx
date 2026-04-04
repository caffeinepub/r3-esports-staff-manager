import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useMarkNotificationRead, useNotifications } from "../hooks/useQueries";
import { formatRelativeTime } from "../utils/helpers";

export function NotificationBell() {
  const { userId } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useNotifications(userId);
  const markRead = useMarkNotificationRead();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = (notifId: bigint) => {
    markRead.mutate(notifId);
  };

  const handleMarkAllRead = () => {
    for (const n of notifications.filter((notif) => !notif.isRead)) {
      markRead.mutate(n.id);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          data-ocid="notifications.open_modal_button"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse-neon">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 bg-gaming-card border-gaming-border"
        data-ocid="notifications.popover"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gaming-border">
          <h3 className="font-semibold text-sm text-foreground">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-neon-peach hover:text-neon-peach/80 h-auto py-0"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-72">
          {notifications.length === 0 ? (
            <div
              className="px-4 py-6 text-center text-muted-foreground text-sm"
              data-ocid="notifications.empty_state"
            >
              No notifications
            </div>
          ) : (
            <div className="divide-y divide-gaming-border">
              {notifications
                .slice()
                .sort((a, b) => Number(b.timestamp - a.timestamp))
                .map((notif, idx) => (
                  <button
                    type="button"
                    key={notif.id.toString()}
                    className={`w-full text-left px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors ${
                      !notif.isRead ? "bg-orange-950/30" : ""
                    }`}
                    onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      !notif.isRead &&
                      handleMarkRead(notif.id)
                    }
                    data-ocid={`notifications.item.${idx + 1}`}
                  >
                    <div className="flex items-start gap-2">
                      {!notif.isRead && (
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-neon-peach shrink-0" />
                      )}
                      <div className={!notif.isRead ? "" : "pl-4"}>
                        <p className="text-sm text-foreground leading-snug">
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatRelativeTime(notif.timestamp)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
