import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Bell,
  CheckCheck,
  Check,
  Trash2,
  RefreshCw,
  Clock,
  ExternalLink,
  Inbox,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatRelativeTime, getNotificationRoute } from "@/lib/notifications";

export default function Notifications() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const limit = 20;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["notifications", page, unreadOnly],
    queryFn: async () => {
      const response = await axios.get("/api/v5/notifications", {
        params: {
          page,
          limit,
          unreadOnly: unreadOnly ? "true" : "false"
        }
      });
      return response.data;
    },
    placeholderData: keepPreviousData
  });

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };

  React.useEffect(() => {
    if (pagination.totalPages > 0 && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [pagination.totalPages, page]);

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;

    try {
      setIsMarkingAll(true);
      const res = await axios.post("/api/v5/notifications/read-all");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications-unread"] })
      ]);
      toast({
        title: "All notifications read",
        description: `Marked ${res.data?.updatedCount || 0} notifications as read.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read.",
        variant: "destructive"
      });
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      setActionInProgressId(id);
      await axios.post(`/api/v5/notifications/${id}/read`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications-unread"] })
      ]);
      toast({
        title: "Notification updated",
        description: "Notification marked as read."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive"
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      setActionInProgressId(id);
      await axios.delete(`/api/v5/notifications/${id}`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications-unread"] })
      ]);
      toast({
        title: "Notification removed",
        description: "Notification has been deleted successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notification.",
        variant: "destructive"
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleItemClick = (item) => {
    if (!item.read) {
      axios
        .post(`/api/v5/notifications/${item.id}/read`)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
        })
        .catch(() => {});
    }

    const route = getNotificationRoute(item.action);
    if (route && route !== "/notifications") {
      navigate(route);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-white/80" />
            <span>Notifications History</span>
          </h1>
          <p className="text-sm text-[#95a1ad] mt-1">
            Review security alerts, support updates, and account activity.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-white/5 bg-[#191b20]/60 hover:bg-white/5 text-[#95a1ad] hover:text-white transition-all disabled:opacity-50"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-white" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || isMarkingAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/15 text-white transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
        </div>
      </div>

      {/* Filter and stats toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#191b20]/40 border border-white/5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setUnreadOnly(false);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !unreadOnly
                ? "bg-white/10 text-white shadow-xs"
                : "text-[#95a1ad] hover:text-white hover:bg-white/5"
            }`}
          >
            All notifications
          </button>
          <button
            type="button"
            onClick={() => {
              setUnreadOnly(true);
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              unreadOnly
                ? "bg-white/10 text-white shadow-xs"
                : "text-[#95a1ad] hover:text-white hover:bg-white/5"
            }`}
          >
            <span>Unread only</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-[#95a1ad]">
          Total: <span className="text-white font-medium">{pagination.total}</span>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#191b20]/20 rounded-xl border border-white/5 text-[#95a1ad]">
            <RefreshCw className="w-6 h-6 animate-spin mb-3 text-white/40" />
            <p className="text-sm">Loading notification history...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-[#191b20]/20 rounded-xl border border-white/5">
            <div className="h-12 w-12 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6 text-white/30" />
            </div>
            <h3 className="text-base font-semibold text-white">
              {unreadOnly ? "No unread notifications" : "No notifications yet"}
            </h3>
            <p className="text-xs text-[#95a1ad] mt-1 max-w-sm">
              {unreadOnly
                ? "You are all caught up! Switch to all notifications to browse your past alerts."
                : "When your servers, account security, or tickets require attention, you'll see them here."}
            </p>
          </div>
        ) : (
          notifications.map((item) => {
            const destinationRoute = getNotificationRoute(item.action);
            const hasDestination = destinationRoute && destinationRoute !== "/notifications";

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                  item.read
                    ? "bg-[#191b20]/20 border-white/5 hover:border-white/10 hover:bg-[#191b20]/40"
                    : "bg-[#191b20]/50 border-white/10 hover:border-white/20 hover:bg-[#191b20]/70 shadow-xs"
                }`}
              >
                {/* Icon indicator */}
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    item.read
                      ? "bg-white/[0.03] text-white/40 border border-white/5"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`text-sm leading-snug ${
                        item.read ? "text-[#95a1ad] font-normal" : "text-white font-medium"
                      }`}
                    >
                      {item.name}
                    </p>
                    {!item.read && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Unread
                      </span>
                    )}
                    {item.action && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-white/50 border border-white/5">
                        {item.action}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                    <span
                      className="inline-flex items-center gap-1 cursor-help hover:text-white/60 transition-colors"
                      title={new Date(item.createdAt).toLocaleString()}
                    >
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(item.createdAt)}
                    </span>
                    {hasDestination && (
                      <span className="inline-flex items-center gap-1 text-white/50 group-hover:text-white transition-colors">
                        <ExternalLink className="w-3 h-3" />
                        <span>Navigate</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div
                  className="flex items-center gap-1 flex-shrink-0 self-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!item.read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(item.id, e)}
                      disabled={actionInProgressId === item.id}
                      title="Mark as read"
                      className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  <ConfirmDialog
                    trigger={
                      <button
                        type="button"
                        disabled={actionInProgressId === item.id}
                        title="Delete notification"
                        className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    }
                    title="Delete notification?"
                    description="Are you sure you want to delete this notification? This action cannot be undone."
                    confirmText="Delete"
                    variant="destructive"
                    onConfirm={() => handleDelete(item.id)}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <p className="text-xs text-[#95a1ad]">
            Page <span className="text-white font-medium">{pagination.page}</span> of{" "}
            <span className="text-white font-medium">{pagination.totalPages}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={pagination.page <= 1 || isFetching}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/5 bg-[#191b20]/60 hover:bg-white/5 text-[#95a1ad] hover:text-white transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              disabled={pagination.page >= pagination.totalPages || isFetching}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/5 bg-[#191b20]/60 hover:bg-white/5 text-[#95a1ad] hover:text-white transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

