"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useHiddenSpace } from "@/components/providers/HiddenSpaceProvider";
import { showDesktopNotification, requestNotificationPermission } from "@/lib/notification";
import { useSocket } from "@/context/SocketProvider";

interface UnreadCounts {
    totalProjectsUnread: number;
    totalCommunitiesUnread: number;
    totalNotifications: number;
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
    const { isHiddenMode } = useHiddenSpace();
    const { socket } = useSocket();
    const [counts, setCounts] = useState<UnreadCounts>({
        totalProjectsUnread: 0,
        totalCommunitiesUnread: 0,
        totalNotifications: 0,
        projects: {},
        communities: {}
    });

    const userInteractedRef = useRef(false);

    useEffect(() => {
        const setInteracted = () => {
            userInteractedRef.current = true;
            document.removeEventListener('click', setInteracted);
            document.removeEventListener('keydown', setInteracted);
            document.removeEventListener('touchstart', setInteracted);
        };
        document.addEventListener('click', setInteracted);
        document.addEventListener('keydown', setInteracted);
        document.addEventListener('touchstart', setInteracted);
        return () => {
            document.removeEventListener('click', setInteracted);
            document.removeEventListener('keydown', setInteracted);
            document.removeEventListener('touchstart', setInteracted);
        };
    }, []);

    const playNotificationSound = useCallback(() => {
        if (userInteractedRef.current) {
            try {
                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                audio.volume = 0.5;
                audio.play().catch(() => { });
            } catch (e) { }
        }
    }, []);

    const refresh = useCallback(async () => {
        if (!session?.user) return;

        try {
            const res = await fetch(`/api/notifications/unread?hidden=${isHiddenMode}&t=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Pragma': 'no-cache' }
            });
            if (res.ok) {
                const data: UnreadCounts = await res.json();
                setCounts(data);
                // Send heartbeat pulse
                fetch("/api/user/pulse", { method: "POST" }).catch(err => console.error("Pulse failed", err));
            }
        } catch (error) {
            console.error("Failed to fetch unread notifications", error);
        }
    }, [session?.user?.id, isHiddenMode]);

    useEffect(() => {
        if (session?.user?.id) {
            refresh();
            // Polling as a slow fallback (every 5 mins) if socket is connected,
            // or normal polling (every 1 min) if socket is disconnected.
            const intervalTime = socket?.connected ? 300000 : 60000;
            const interval = setInterval(refresh, intervalTime);
            return () => clearInterval(interval);
        }
    }, [session?.user?.id, refresh, socket?.connected]);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification: any) => {
            refresh();
            showDesktopNotification(notification.title, {
                body: notification.message,
                tag: notification._id
            });
            playNotificationSound();
        };

        const handleNewActivity = (activity: any) => {
            refresh();
            // Optional: Show desktop notification for activities?
        };

        const handleNewChat = (message: any) => {
            // Only refresh counts if we are not the sender
            if (message.senderId._id !== session?.user?.id) {
                refresh();
            }
        };

        socket.on("notification:new", handleNewNotification);
        socket.on("activity:new", handleNewActivity);
        socket.on("chat:new", handleNewChat);

        return () => {
            socket.off("notification:new", handleNewNotification);
            socket.off("activity:new", handleNewActivity);
            socket.off("chat:new", handleNewChat);
        };
    }, [socket, refresh, playNotificationSound, session?.user?.id]);

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
