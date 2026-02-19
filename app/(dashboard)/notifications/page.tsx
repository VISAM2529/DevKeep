"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { NotificationsHeader } from "@/components/notifications/NotificationsHeader";
import { NotificationsSearch } from "@/components/notifications/NotificationsSearch";
import { NotificationsTabs, TabType } from "@/components/notifications/NotificationsTabs";
import { NotificationGroup } from "@/components/notifications/NotificationGroup";
import { NotificationItem, Notification } from "@/components/notifications/NotificationItem";
import { isToday, isYesterday, isThisWeek, parseISO } from "date-fns";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
    const { refresh } = useNotifications();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) => (n._id === id ? { ...n, read: true } : n))
                );
                refresh();
            }
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const markAllRead = async () => {
        try {
            const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
            if (res.ok) {
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                refresh();
            }
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    const clearAll = async () => {
        try {
            const res = await fetch("/api/notifications", { method: "DELETE" });
            if (res.ok) {
                setNotifications([]);
                refresh();
            }
        } catch (err) {
            console.error("Failed to clear notifications", err);
        }
    };

    // Filtering logic
    const filteredNotifications = useMemo(() => {
        return notifications.filter((n) => {
            // Tab filtering
            if (activeTab === "unread" && n.read) return false;
            if (activeTab === "mentions" && !(
                n.title.toLowerCase().includes("mentioned") ||
                n.message.toLowerCase().includes("@") ||
                n.title.toLowerCase().includes("@")
            )) return false;
            if (activeTab === "system" && n.type !== "system") return false;
            if (activeTab === "activity" && n.type === "system") return false;

            // Search filtering
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return (
                    n.title.toLowerCase().includes(q) ||
                    n.message.toLowerCase().includes(q) ||
                    n.projectId?.name.toLowerCase().includes(q) ||
                    n.senderId?.name.toLowerCase().includes(q)
                );
            }

            return true;
        });
    }, [notifications, activeTab, searchQuery]);

    // Grouping logic
    const groupedNotifications = useMemo(() => {
        const groups: Record<string, Notification[]> = {
            Today: [],
            Yesterday: [],
            "This Week": [],
            Older: [],
        };

        filteredNotifications.forEach((n) => {
            const date = parseISO(n.createdAt);
            if (isToday(date)) {
                groups.Today.push(n);
            } else if (isYesterday(date)) {
                groups.Yesterday.push(n);
            } else if (isThisWeek(date)) {
                groups["This Week"].push(n);
            } else {
                groups.Older.push(n);
            }
        });

        return Object.entries(groups).filter(([_, items]) => items.length > 0);
    }, [filteredNotifications]);

    const counts = useMemo(() => ({
        all: notifications.length,
        unread: notifications.filter((n) => !n.read).length,
        mentions: notifications.filter((n) =>
            n.title.toLowerCase().includes("mentioned") ||
            n.message.toLowerCase().includes("@") ||
            n.title.toLowerCase().includes("@")
        ).length,
        system: notifications.filter((n) => n.type === "system").length,
        activity: notifications.filter((n) => n.type !== "system").length,
    }), [notifications]);

    return (
        <div className="min-h-screen bg-black flex flex-col">
            <NotificationsHeader
                unreadCount={counts.unread}
                onMarkAllRead={markAllRead}
                onClearAll={clearAll}
            />

            <div className="px-6 py-4 flex flex-col gap-4 sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-white/[0.04]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <NotificationsTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        counts={counts}
                    />
                    <NotificationsSearch onSearch={setSearchQuery} />
                </div>
            </div>

            <main className="flex-1 pb-20 no-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="h-8 w-8 rounded-full border-2 border-zinc-700 border-t-zinc-400 animate-spin" />
                        <p className="text-sm text-zinc-500">Syncing your notifications...</p>
                    </div>
                ) : groupedNotifications.length > 0 ? (
                    <div className="max-w-7xl mx-auto">
                        {groupedNotifications.map(([title, items]) => (
                            <NotificationGroup key={title} title={title}>
                                {items.map((n) => (
                                    <NotificationItem
                                        key={n._id}
                                        notification={n}
                                        onMarkRead={markAsRead}
                                    />
                                ))}
                            </NotificationGroup>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center px-6">
                        <div className="h-20 w-20 rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
                            <Bell className="h-8 w-8 text-zinc-700" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">No notifications found</h2>
                        <p className="text-zinc-500 mt-2 max-w-sm mx-auto">
                            {searchQuery
                                ? `We couldn't find any notifications matching "${searchQuery}"`
                                : "You're all caught up! There are no notifications to show here."}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
