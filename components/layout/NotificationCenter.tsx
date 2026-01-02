"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Trash2, Info, CheckCircle2, AlertCircle, X, Video } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/components/providers/NotificationProvider";
import Link from "next/link";

export function NotificationCenter() {
    const { counts, refresh } = useNotifications();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications/${id}/read`, {
                method: "PATCH",
            });
            if (res.ok) {
                setNotifications(notifications.map(n =>
                    n._id === id ? { ...n, read: true } : n
                ));
                refresh();
            }
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const clearAll = async () => {
        try {
            const res = await fetch("/api/notifications", {
                method: "DELETE",
            });
            if (res.ok) {
                setNotifications([]);
                refresh();
            }
        } catch (error) {
            console.error("Failed to clear notifications", error);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "task_assigned": return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
            case "task_update": return <Info className="h-4 w-4 text-emerald-500" />;
            case "community_event": return <Info className="h-4 w-4 text-purple-500" />;
            case "system": return <AlertCircle className="h-4 w-4 text-amber-500" />;
            case "meeting_started": return <Video className="h-4 w-4 text-green-500" />;
            default: return <Info className="h-4 w-4 text-muted-foreground" />;
        }
    };

    return (
        <DropdownMenu onOpenChange={(open) => open && fetchNotifications()}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-white transition-colors">
                    <Bell className="h-5 w-5" />
                    {counts.totalNotifications > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg shadow-red-500/20 animate-in fade-in zoom-in duration-300">
                            {counts.totalNotifications > 9 ? "9+" : counts.totalNotifications}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px] p-0 bg-[#121212] border-white/5 shadow-2xl overflow-hidden rounded-xl">
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {counts.totalNotifications > 0 && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-white/5 text-muted-foreground">
                                {counts.totalNotifications} New
                            </Badge>
                        )}
                    </div>
                    {notifications.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground hover:text-white gap-2"
                            onClick={clearAll}
                        >
                            <Trash2 className="h-3 w-3" />
                            Clear All
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {loading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] gap-3">
                            <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                            <p className="text-xs text-muted-foreground">Syncing alerts...</p>
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="divide-y divide-white/5">
                            {notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={cn(
                                        "flex gap-3 p-4 transition-colors hover:bg-white/[0.02]",
                                        !notification.read && "bg-white/[0.03]"
                                    )}
                                >
                                    <div className="mt-1 shrink-0 rounded-full bg-white/5 p-1.5">
                                        {getTypeIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={cn(
                                                "text-xs font-semibold leading-none",
                                                !notification.read ? "text-white" : "text-muted-foreground"
                                            )}>
                                                {notification.title}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground shrink-0">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-2 pt-1.5">
                                            {!notification.read && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-[10px] text-primary hover:text-primary hover:bg-primary/10 gap-1"
                                                    onClick={() => markAsRead(notification._id)}
                                                >
                                                    <Check className="h-3 w-3" />
                                                    Mark Read
                                                </Button>
                                            )}
                                            {notification.link && (
                                                <Link href={notification.link}>
                                                    <Button
                                                        variant={notification.type === 'meeting_started' ? "default" : "ghost"}
                                                        size="sm"
                                                        className={`h-7 px-2 text-[10px] ${notification.type === 'meeting_started' ? "bg-green-600 hover:bg-green-700 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
                                                    >
                                                        {notification.type === 'meeting_started' ? "Join Meeting" : "View Details"}
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center p-6 bg-white/[0.01]">
                            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                <Bell className="h-6 w-6 text-muted-foreground/40" />
                            </div>
                            <h4 className="text-sm font-medium text-white/90">All Caught Up</h4>
                            <p className="text-xs text-muted-foreground mt-1 max-w-[180px]">
                                No new notifications at the moment.
                            </p>
                        </div>
                    )}
                </ScrollArea>

                {notifications.length > 5 && (
                    <div className="p-3 border-t border-white/5 bg-white/[0.01]">
                        <Button variant="ghost" className="w-full h-8 text-xs text-muted-foreground hover:text-white">
                            View Archive
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
