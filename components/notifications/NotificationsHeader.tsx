"use client";

import { CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NotificationsHeaderProps {
    unreadCount: number;
    onMarkAllRead: () => Promise<void>;
    onClearAll: () => Promise<void>;
}

export function NotificationsHeader({ unreadCount, onMarkAllRead, onClearAll }: NotificationsHeaderProps) {
    const [marking, setMarking] = useState(false);
    const [clearing, setClearing] = useState(false);

    const handleMarkAllRead = async () => {
        setMarking(true);
        try {
            await onMarkAllRead();
        } finally {
            setMarking(false);
        }
    };

    const handleClearAll = async () => {
        if (!confirm("Are you sure you want to delete all notifications?")) return;
        setClearing(true);
        try {
            await onClearAll();
        } finally {
            setClearing(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-8 border-b border-white/[0.04]">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Notifications</h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Manage your alerts and staying up-to-date with your projects.
                </p>
            </div>
            <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={marking}
                        onClick={handleMarkAllRead}
                        className="text-xs text-zinc-400 hover:text-white hover:bg-white/5 gap-2 h-9 px-4"
                    >
                        <CheckCheck className={marking ? "h-3.5 w-3.5 animate-pulse" : "h-3.5 w-3.5"} />
                        {marking ? "Marking..." : "Mark all as read"}
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={clearing}
                    onClick={handleClearAll}
                    className="text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 gap-2 h-9 px-4 transition-colors"
                >
                    <Trash2 className={clearing ? "h-3.5 w-3.5 animate-pulse" : "h-3.5 w-3.5"} />
                    {clearing ? "Clearing..." : "Clear history"}
                </Button>
            </div>
        </div>
    );
}
