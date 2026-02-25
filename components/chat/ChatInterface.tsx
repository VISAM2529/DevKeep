"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Check, CheckCheck, Maximize2, Minimize2 } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { useSocket } from "@/context/SocketProvider";
import { useNotifications } from "@/components/providers/NotificationProvider";

interface Message {
    _id: string;
    content: string;
    senderId: {
        _id: string;
        name: string;
        image?: string;
        lastSeen?: string;
    };
    readBy: {
        userId: { _id: string; name: string };
        readAt: string;
    }[];
    meetingId?: string;
    createdAt: string;
}

interface ChatInterfaceProps {
    communityId?: string;
    projectId?: string;
    meetingId?: string; // Optional meeting ID for isolated chat
    className?: string; // Allow custom styling
}

export function ChatInterface({ communityId, projectId, meetingId, className }: ChatInterfaceProps) {
    const { data: session } = useSession();
    const { refresh } = useNotifications();
    const { socket, joinCommunityRoom, joinProjectRoom, leaveRoom } = useSocket();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const apiEndpoint = projectId
        ? `/api/projects/${projectId}/messages`
        : `/api/communities/${communityId}/messages`;

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, []);

    const markAsRead = useCallback(async () => {
        try {
            await fetch(`${apiEndpoint}/read`, {
                method: "POST",
            });
            refresh();

            if (socket?.connected) {
                socket.emit("chat:mark-read", { communityId, projectId });
            }
        } catch (error) {
            console.error("Failed to mark messages as read", error);
        }
    }, [apiEndpoint, refresh, socket, communityId, projectId]);

    const fetchMessages = useCallback(async () => {
        try {
            const url = meetingId
                ? `${apiEndpoint}?meetingId=${meetingId}`
                : apiEndpoint;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                markAsRead();
                setTimeout(scrollToBottom, 100);
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            setIsLoading(false);
        }
    }, [apiEndpoint, meetingId, markAsRead, scrollToBottom]);

    useEffect(() => {
        fetchMessages();

        // ── Room Management ──────────────────────────────────────────────────
        if (communityId) joinCommunityRoom(communityId);
        if (projectId) joinProjectRoom(projectId);

        // ── Socket Event Listeners ───────────────────────────────────────────
        if (!socket) return;

        const handleNewMessage = (message: Message) => {
            // Filter by meetingId if applicable
            if (meetingId && message.meetingId !== meetingId) return;

            setMessages((prev) => {
                // Prevent duplicates
                if (prev.some(m => m._id === message._id)) return prev;
                return [...prev, message];
            });

            // Mark as read if user is looking at the chat
            if (document.visibilityState === 'visible') {
                markAsRead();
            }
        };

        socket.on("chat:new", handleNewMessage);

        return () => {
            socket.off("chat:new", handleNewMessage);
            if (communityId) leaveRoom(`community-${communityId}`);
            if (projectId) leaveRoom(`project-${projectId}`);
        };
    }, [communityId, projectId, meetingId, socket, joinCommunityRoom, joinProjectRoom, leaveRoom, fetchMessages, markAsRead]);

    useEffect(() => {
        scrollToBottom();
    }, [messages.length, scrollToBottom]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        const content = newMessage.trim();
        setNewMessage(""); // Clear early for better UX
        setIsSending(true);

        // Try socket emission first
        if (socket?.connected) {
            socket.emit("chat:send", {
                communityId,
                projectId,
                meetingId,
                content
            }, (res: { success: boolean, message?: Message, error?: string }) => {
                setIsSending(false);
                if (!res.success) {
                    console.error("Socket send failed:", res.error);
                    // Fallback to REST? Or show error?
                }
            });
        } else {
            // FALLBACK TO REST API
            try {
                const res = await fetch(apiEndpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content, meetingId }),
                });

                if (res.ok) {
                    const message = await res.json();
                    setMessages((prev) => {
                        if (prev.some(m => m._id === message._id)) return prev;
                        return [...prev, message];
                    });
                }
            } catch (error) {
                console.error("Failed to send message via REST", error);
            } finally {
                setIsSending(false);
            }
        }
    };

    return (
        <div className={`flex flex-col border border-border/40 rounded-xl bg-card overflow-hidden transition-all duration-300 ${isFullscreen
            ? "fixed inset-0 z-[100] rounded-none md:rounded-none h-screen w-screen"
            : className || "h-[500px] md:h-[600px] relative"
            }`}>
            <div className="p-3 md:p-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-xs md:text-sm flex items-center gap-2 text-foreground">
                        {projectId ? "Project Discussion" : "Community Chat"}
                    </h3>
                    {!socket?.connected && (
                        <span className="flex h-2 w-2 rounded-full bg-yellow-500 animate-pulse" title="Connecting real-time..." />
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm py-8">
                            No messages yet. Start the conversation!
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.senderId?._id === session?.user?.id;

                            // Check read status (excluding sender)
                            const readers = msg.readBy?.filter((r: any) => r.userId && (r.userId._id || r.userId) !== (msg.senderId?._id || msg.senderId)) || [];
                            const isSeen = readers.length > 0;
                            const seenByNames = readers.map((r: any) => r.userId?.name || "Someone").join(", ");

                            const isActive = (lastSeen?: string) => {
                                if (!lastSeen) return false;
                                const lastSeenDate = new Date(lastSeen);
                                const now = new Date();
                                return now.getTime() - lastSeenDate.getTime() < 5 * 60 * 1000;
                            };

                            return (
                                <div
                                    key={msg._id}
                                    className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                                >
                                    <div className="relative">
                                        <Avatar className="h-8 w-8 border border-border/40">
                                            <AvatarImage src={msg.senderId?.image} />
                                            <AvatarFallback className="text-[10px]">
                                                {getInitials(msg.senderId?.name || "??")}
                                            </AvatarFallback>
                                        </Avatar>
                                        {isActive(msg.senderId?.lastSeen) && (
                                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-card pulse-dot shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                        )}
                                    </div>
                                    <div
                                        className={`flex flex-col max-w-[85%] md:max-w-[80%] ${isMe ? "items-end" : "items-start"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                {msg.senderId?.name || "Deleted User"}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/60">
                                                {format(new Date(msg.createdAt), "HH:mm")}
                                            </span>
                                        </div>
                                        <div className="relative group">
                                            <div
                                                className={`px-3 py-2 rounded-lg text-sm ${isMe
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground"
                                                    }`}
                                            >
                                                {msg.content}
                                            </div>
                                            {isMe && (
                                                <div
                                                    className="absolute -bottom-4 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title={seenByNames ? `Seen by: ${seenByNames}` : "Sent"}
                                                >
                                                    {isSeen ? (
                                                        <CheckCheck className="h-3 w-3 text-blue-500" />
                                                    ) : (
                                                        <Check className="h-3 w-3 text-muted-foreground" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>

            <div className="p-3 border-t border-border/40 bg-card">
                <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                    <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                        {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
