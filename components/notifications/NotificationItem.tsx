"use client";

import { Bell, Check, Info, CheckCircle2, AlertCircle, Video, ArrowRight, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    link?: string;
    createdAt: string;
    senderId?: { name: string; image?: string };
    projectId?: { name: string };
}

interface NotificationItemProps {
    notification: Notification;
    onMarkRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
    const getTypeIcon = (type: string) => {
        const base = "h-5 w-5";
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
                return <Bell className={cn(base, "text-zinc-400")} />;
        }
    };

    const getIconBg = (type: string) => {
        switch (type) {
            case "task_assigned": return "bg-blue-500/10";
            case "task_update": return "bg-emerald-500/10";
            case "community_event": return "bg-purple-500/10";
            case "system": return "bg-amber-500/10";
            case "meeting_started": return "bg-green-500/10";
            default: return "bg-zinc-500/10";
        }
    };

    return (
        <div
            className={cn(
                "group relative flex gap-4 px-6 py-5 cursor-pointer transition-all duration-200 border-b border-white/[0.04]",
                "hover:bg-white/[0.02]",
                !notification.read && "bg-white/[0.01]"
            )}
            onClick={() => !notification.read && onMarkRead(notification._id)}
        >
            {/* Unread Indicator */}
            {!notification.read && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
            )}

            {/* Avatar or Icon */}
            <div className="shrink-0">
                {notification.senderId?.image ? (
                    <img
                        src={notification.senderId.image}
                        alt={notification.senderId.name}
                        className="h-10 w-10 rounded-full border border-white/10"
                    />
                ) : (
                    <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center border border-white/5",
                        getIconBg(notification.type)
                    )}>
                        {getTypeIcon(notification.type)}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={cn(
                                "text-[14px] font-medium leading-none",
                                notification.read ? "text-zinc-400" : "text-white"
                            )}>
                                {notification.title}
                            </h4>
                            {notification.projectId?.name && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-500 border border-white/10">
                                    {notification.projectId.name}
                                </span>
                            )}
                        </div>
                        <p className="text-[12px] text-zinc-500 line-clamp-2 leading-relaxed max-w-2xl">
                            {notification.message}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className="text-[11px] text-zinc-600 whitespace-nowrap">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                        {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        )}
                    </div>
                </div>

                {notification.link && (
                    <div className="mt-3 flex items-center gap-3">
                        <Link
                            href={notification.link}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                                "inline-flex items-center gap-1.5 text-[11px] font-medium transition-colors",
                                notification.type === "meeting_started"
                                    ? "text-green-400 hover:text-green-300"
                                    : "text-blue-400 hover:text-blue-300"
                            )}
                        >
                            {notification.type === "meeting_started" ? "Join Meeting" : "View Details"}
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
