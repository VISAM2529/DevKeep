"use client";

import { cn } from "@/lib/utils";

export type TabType = "all" | "unread" | "mentions" | "system" | "activity";

interface NotificationsTabsProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    counts: {
        all: number;
        unread: number;
        mentions: number;
        system: number;
        activity: number;
    };
}

export function NotificationsTabs({ activeTab, onTabChange, counts }: NotificationsTabsProps) {
    const tabs: { id: TabType; label: string }[] = [
        { id: "all", label: "All" },
        { id: "unread", label: "Unread" },
        { id: "mentions", label: "Mentions" },
        { id: "system", label: "System" },
        { id: "activity", label: "Activity" },
    ];

    return (
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
                        activeTab === tab.id
                            ? "bg-white/[0.08] text-white"
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                    )}
                >
                    {tab.label}
                    {counts[tab.id] > 0 && (
                        <span className={cn(
                            "px-1.5 py-0.5 rounded-full text-[10px] min-w-[18px] text-center",
                            activeTab === tab.id
                                ? "bg-white/20 text-white"
                                : "bg-white/10 text-zinc-500"
                        )}>
                            {counts[tab.id] > 99 ? "99+" : counts[tab.id]}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
