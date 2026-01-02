"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { showDesktopNotification, requestNotificationPermission } from "@/lib/notification";

interface UnreadCounts {
    totalProjectsUnread: number;
    totalCommunitiesUnread: number;
    projects: Record<string, { messages: number; tasks: number; name: string }>;
    communities: Record<string, { messages: number; name: string }>;
}

interface NotificationContextType {
    counts: UnreadCounts;
    refresh: () => Promise<void>;
    requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [counts, setCounts] = useState<UnreadCounts>({
        totalProjectsUnread: 0,
        totalCommunitiesUnread: 0,
        projects: {},
        communities: {}
    });

    const prevCountsRef = useRef<UnreadCounts>(counts);

    const refresh = useCallback(async () => {
        if (!session?.user?.id) return;
        try {
            const res = await fetch("/api/notifications/unread");
            if (res.ok) {
                const data: UnreadCounts = await res.json();

                // Compare with previous counts to trigger notifications
                const prev = prevCountsRef.current;

                // 1. Check for new project messages or tasks
                Object.keys(data.projects).forEach(projectId => {
                    const current = data.projects[projectId];
                    const previous = prev.projects[projectId] || { messages: 0, tasks: 0 };

                    if (current.messages > previous.messages) {
                        showDesktopNotification(`New Message: ${current.name}`, {
                            body: "Someone sent a message in this project.",
                            tag: `project-msg-${projectId}`
                        });
                    }

                    if (current.tasks > previous.tasks) {
                        showDesktopNotification(`Task Assigned: ${current.name}`, {
                            body: "You have a new task assigned to you in this project.",
                            tag: `project-task-${projectId}`
                        });
                    }
                });

                // 2. Check for new community messages
                Object.keys(data.communities).forEach(communityId => {
                    const current = data.communities[communityId];
                    const previous = prev.communities[communityId] || { messages: 0 };

                    if (current.messages > previous.messages) {
                        showDesktopNotification(`New Community Message: ${current.name}`, {
                            body: "There is a new message in your community chat.",
                            tag: `community-msg-${communityId}`
                        });
                    }
                });

                setCounts(data);
                prevCountsRef.current = data;
            }
        } catch (error) {
            console.error("Failed to fetch unread notifications", error);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        if (session?.user?.id) {
            refresh();
            // Polling every 1 minute for updates
            const interval = setInterval(refresh, 60000);
            return () => clearInterval(interval);
        }
    }, [session?.user?.id, refresh]);

    const requestPermission = async () => {
        return await requestNotificationPermission();
    };

    return (
        <NotificationContext.Provider value={{ counts, refresh, requestPermission }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
