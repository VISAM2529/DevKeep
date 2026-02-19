"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
    Bell,
    Check,
    CheckCheck,
    Info,
    CheckCircle2,
    AlertCircle,
    Video,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/components/providers/NotificationProvider";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    link?: string;
    createdAt: string;
    senderId?: { name: string; image?: string };
}

type TabType = "all" | "unread";

// ─── Icon helper ──────────────────────────────────────────────────────────────

function getTypeIcon(type: string) {
    const base = "h-4 w-4";
    switch (type) {
        case "task_assigned":
            return <CheckCircle2 className={cn(base, "text-blue-400")} />;
        case "task_update":
            return <Info className={cn(base, "text-emerald-400")} />;
        case "community_event":
            return <Info className={cn(base, "text-purple-400")} />;
        case "system":
            return <AlertCircle className={cn(base, "text-amber-400")} />;
        case "meeting_started":
            return <Video className={cn(base, "text-green-400")} />;
        default:
            return <Info className={cn(base, "text-zinc-400")} />;
    }
}

function getIconBg(type: string) {
    switch (type) {
        case "task_assigned": return "bg-blue-500/10";
        case "task_update": return "bg-emerald-500/10";
        case "community_event": return "bg-purple-500/10";
        case "system": return "bg-amber-500/10";
        case "meeting_started": return "bg-green-500/10";
        default: return "bg-zinc-500/10";
    }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NotificationItem({
    notification,
    onMarkRead,
}: {
    notification: Notification;
    onMarkRead: (id: string) => void;
}) {
    return (
        <div
            className={cn(
                "group relative flex gap-3 px-4 py-3.5 cursor-pointer transition-colors duration-150",
                "hover:bg-white/[0.04]",
                !notification.read && "bg-white/[0.025]"
            )}
            onClick={() => !notification.read && onMarkRead(notification._id)}
        >
            {/* Unread dot */}
            {!notification.read && (
                <span className="absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            )}

            {/* Icon */}
            <div
                className={cn(
                    "mt-0.5 shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                    getIconBg(notification.type)
                )}
            >
                {getTypeIcon(notification.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p
                        className={cn(
                            "text-[13px] font-medium leading-snug truncate",
                            notification.read ? "text-zinc-400" : "text-white"
                        )}
                    >
                        {notification.title}
                    </p>
                    <span className="text-[10px] text-zinc-600 shrink-0 mt-0.5">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                        })}
                    </span>
                </div>

                <p className="text-[12px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                    {notification.message}
                </p>

                {notification.link && (
                    <Link
                        href={notification.link}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium transition-colors",
                            notification.type === "meeting_started"
                                ? "text-green-400 hover:text-green-300"
                                : "text-blue-400 hover:text-blue-300"
                        )}
                    >
                        {notification.type === "meeting_started" ? "Join Meeting" : "View Details"}
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                )}
            </div>
        </div>
    );
}

function EmptyState({ tab }: { tab: TabType }) {
    return (
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-zinc-300">
                {tab === "unread" ? "No unread notifications" : "You're all caught up!"}
            </p>
            <p className="text-xs text-zinc-600 mt-1.5 max-w-[200px] leading-relaxed">
                {tab === "unread"
                    ? "All notifications have been read."
                    : "We'll notify you when something happens."}
            </p>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NotificationCenter() {
    const { counts, refresh } = useNotifications();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("all");

    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // ── Fetch ──────────────────────────────────────────────────────────────────
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

    // ── Open / close ───────────────────────────────────────────────────────────
    const toggleOpen = () => {
        if (!open) {
            setOpen(true);
            fetchNotifications();
        } else {
            setOpen(false);
        }
    };

    // Close on outside click or Escape
    useEffect(() => {
        if (!open) return;

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        const handleClick = (e: MouseEvent) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("keydown", handleKey);
        document.addEventListener("mousedown", handleClick);
        return () => {
            document.removeEventListener("keydown", handleKey);
            document.removeEventListener("mousedown", handleClick);
        };
    }, [open]);

    // ── Actions ────────────────────────────────────────────────────────────────
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

    const markAllAsRead = async () => {
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

    // ── Derived state ──────────────────────────────────────────────────────────
    const unreadCount = notifications.filter((n) => !n.read).length;
    const displayedNotifications =
        activeTab === "unread"
            ? notifications.filter((n) => !n.read)
            : notifications;

    const bellCount = counts.totalNotifications;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="relative">
            {/* Bell trigger */}
            <button
                ref={triggerRef}
                onClick={toggleOpen}
                aria-label="Open notifications"
                className={cn(
                    "relative h-9 w-9 flex items-center justify-center rounded-lg transition-colors duration-150",
                    "text-zinc-400 hover:text-white hover:bg-white/[0.06]",
                    open && "text-white bg-white/[0.06]"
                )}
            >
                <Bell className="h-5 w-5" />
                {bellCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg shadow-red-500/30 animate-in fade-in zoom-in duration-200">
                        {bellCount > 9 ? "9+" : bellCount}
                    </span>
                )}
            </button>

            {/* Floating panel */}
            {open && (
                <div
                    ref={panelRef}
                    className={cn(
                        "absolute left-0 top-[calc(100%+10px)] z-[200]",
                        "w-[360px] max-h-[520px] flex flex-col",
                        "rounded-2xl border border-white/[0.07]",
                        "bg-[#111111] shadow-[0_24px_64px_rgba(0,0,0,0.6)]",
                        // responsive: on very small screens shift left to avoid overflow
                        "max-sm:-left-[calc(360px-2.25rem)]",
                        // animation
                        "animate-in fade-in slide-in-from-top-2 duration-200"
                    )}
                    style={{ transformOrigin: "top left" }}
                >
                    {/* ── Header ── */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-semibold">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-200 transition-colors duration-150"
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/[0.06] mx-4" />

                    {/* ── Tabs ── */}
                    <div className="flex gap-1 px-4 pt-3 pb-2">
                        {(["all", "unread"] as TabType[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[12px] capitalize transition-all duration-150",
                                    activeTab === tab
                                        ? "bg-white/[0.08] text-white font-medium"
                                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                                )}
                            >
                                {tab}
                                {tab === "unread" && unreadCount > 0 && (
                                    <span className="ml-1.5 text-[10px] text-zinc-500">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ── Notification list ── */}
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {loading && notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 gap-3">
                                <div className="h-7 w-7 rounded-full border-2 border-zinc-700 border-t-zinc-400 animate-spin" />
                                <p className="text-xs text-zinc-600">Loading notifications…</p>
                            </div>
                        ) : displayedNotifications.length > 0 ? (
                            <div className="divide-y divide-white/[0.04]">
                                {displayedNotifications.map((n) => (
                                    <NotificationItem
                                        key={n._id}
                                        notification={n}
                                        onMarkRead={markAsRead}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState tab={activeTab} />
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div className="border-t border-white/[0.06]">
                        <Link
                            href="/notifications"
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-center gap-1.5 py-3 text-[12px] text-zinc-500 hover:text-zinc-200 transition-colors duration-150 group"
                        >
                            View All Notifications
                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
