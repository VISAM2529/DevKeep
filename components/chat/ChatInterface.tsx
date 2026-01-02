"use client";

import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Check, CheckCheck, Maximize2, Minimize2 } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { format } from "date-fns";

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
    createdAt: string;
}

interface ChatInterfaceProps {
    communityId?: string;
    projectId?: string;
}

import { useNotifications } from "@/components/providers/NotificationProvider";

export function ChatInterface({ communityId, projectId }: ChatInterfaceProps) {
    const { data: session } = useSession();
    const { refresh } = useNotifications();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const apiEndpoint = projectId
        ? `/api/projects/${projectId}/messages`
        : `/api/communities/${communityId}/messages`;

    const scrollToBottom = () => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    };

    const markAsRead = async () => {
        try {
            await fetch(`${apiEndpoint}/read`, {
                method: "POST",
            });
            refresh();
        } catch (error) {
            console.error("Failed to mark messages as read", error);
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch(apiEndpoint);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);

                // Mark as read whenever we fetch. 
                markAsRead();

                // Only scroll if we were already loading (initial load)
                if (isLoading) {
                    setTimeout(scrollToBottom, 100);
                }
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        // Polling every 5 seconds for new messages
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [communityId, projectId]); // Depend on both

    useEffect(() => {
        scrollToBottom();
    }, [messages.length]);


    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            const res = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newMessage }),
            });

            if (res.ok) {
                const message = await res.json();
                setMessages((prev) => [...prev, message]);
                setNewMessage("");
            }
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className={`flex flex-col border border-border/40 rounded-xl bg-card overflow-hidden transition-all duration-300 ${isFullscreen
            ? "fixed inset-0 z-[100] rounded-none md:rounded-none h-screen w-screen"
            : "h-[500px] md:h-[600px] relative"
            }`}>
            <div className="p-3 md:p-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
                <h3 className="font-semibold text-xs md:text-sm flex items-center gap-2 text-foreground">
                    {projectId ? "Project Discussion" : "Community Chat"}
                </h3>
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
                            const isMe = msg.senderId._id === session?.user?.id;

                            // Check read status (excluding sender)
                            const readers = msg.readBy?.filter((r: any) => r.userId && r.userId._id !== msg.senderId._id) || [];
                            const isSeen = readers.length > 0;
                            const seenByNames = readers.map((r: any) => r.userId.name).join(", ");

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
                                            <AvatarImage src={msg.senderId.image} />
                                            <AvatarFallback className="text-[10px]">
                                                {getInitials(msg.senderId.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        {isActive(msg.senderId.lastSeen) && (
                                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-card pulse-dot shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                        )}
                                    </div>
                                    <div
                                        className={`flex flex-col max-w-[85%] md:max-w-[80%] ${isMe ? "items-end" : "items-start"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                {msg.senderId.name}
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
