import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelativeTime, getNotificationRoute } from "@/lib/notifications";

export function NotificationBell({ side = "top", align = "end", className = "" }) {
  const [open, setOpen] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: async () => {
      const response = await axios.get("/api/v5/notifications", {
        params: { limit: 10 }
      });
      return response.data;
    },
    refetchInterval: 45000,
    refetchOnWindowFocus: true
  });

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    if (unreadCount === 0 || isMarkingAll) return;

    try {
      setIsMarkingAll(true);
      await axios.post("/api/v5/notifications/read-all");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications-unread"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] })
      ]);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleNotificationClick = (notification) => {
    setOpen(false);

    if (!notification.read) {
      axios
        .post(`/api/v5/notifications/${notification.id}/read`)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        })
        .catch((error) => {
          console.error("Failed to mark notification as read:", error);
        });
    }

    const route = getNotificationRoute(notification.action);
    navigate(route);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Open notifications"
          className={`relative inline-flex items-center justify-center h-10 w-10 rounded-xl border border-white/5 bg-[#191b20]/40 hover:bg-white/5 text-[#95a1ad] hover:text-white transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 ${className}`}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-[#08090c] animate-in fade-in zoom-in-75 duration-200">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        side={side}
        align={align}
        sideOffset={8}
        className="w-80 sm:w-96 p-0 bg-[#202229] border border-white/5 shadow-2xl rounded-xl text-white overflow-hidden z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                {unreadCount} unread
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={unreadCount === 0 || isMarkingAll}
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            {isMarkingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5" />
            )}
            <span>Mark all as read</span>
          </button>
        </div>

        {/* Notification List */}
        <ScrollArea className="max-h-[360px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-xs text-[#95a1ad] gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-white/40" />
              <span>Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="h-10 w-10 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center mb-2.5">
                <Bell className="w-4 h-4 text-white/30" />
              </div>
              <p className="text-sm font-medium text-white/70">No notifications yet</p>
              <p className="text-xs text-[#95a1ad] mt-0.5">We'll alert you when something happens.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNotificationClick(item)}
                  className="w-full text-left p-3.5 flex items-start gap-3 hover:bg-white/[0.04] transition-colors group cursor-pointer"
                >
                  <div className="mt-0.5 h-7 w-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70 transition-colors" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-xs leading-snug break-words ${
                          item.read
                            ? "text-[#95a1ad] font-normal"
                            : "text-white font-medium"
                        }`}
                      >
                        {item.name}
                      </p>
                      {!item.read && (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0"
                          title="Unread"
                        />
                      )}
                    </div>
                    <span className="block text-[10px] text-white/40 mt-1 font-mono">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <Link
          to="/notifications"
          onClick={() => setOpen(false)}
          className="block py-2.5 text-center text-xs font-medium text-white/70 hover:text-white border-t border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
        >
          View all notifications &rarr;
        </Link>
      </PopoverContent>
    </Popover>
  );
}

