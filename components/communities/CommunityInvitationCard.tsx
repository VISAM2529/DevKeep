"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Check, X, Users, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useHiddenSpace } from "@/components/providers/HiddenSpaceProvider";

interface CommunityInvitationCardProps {
    community: {
        _id: string;
        name: string;
        description?: string;
        ownerId: { _id: string; email: string; name: string };
        members: { userId: string; role: string; joinedAt: Date; accepted: boolean }[];
    };
    onUpdate: () => void;
    currentUserId?: string;
}

export function CommunityInvitationCard({ community, onUpdate, currentUserId }: CommunityInvitationCardProps) {
    const { toast } = useToast();
    const { isHiddenMode } = useHiddenSpace();
    const [isLoading, setIsLoading] = useState(false);

    const handleAccept = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/communities/${community._id}/accept`, {
                method: "POST",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to accept invitation");
            }

            toast({
                title: "Invitation Accepted",
                description: `You are now a member of ${community.name}.`,
            });
            onUpdate();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDecline = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/communities/${community._id}/accept`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to decline invitation");
            }

            toast({
                title: "Invitation Declined",
                description: `Declined invitation for ${community.name}.`,
            });
            onUpdate();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Find the current user's invitation details
    // We assume the parent component passes the community object populated or structured correctly
    // or we might need to search the members array if we have the userId
    // Ideally we filter before passing, but here we can just show the card.

    return (
        <Card className={cn(
            "transition-all",
            isHiddenMode
                ? "border-purple-500/30 bg-purple-500/5 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                : "border-blue-500/20 bg-blue-500/5"
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Users className={cn("h-4 w-4", isHiddenMode ? "text-purple-400" : "text-blue-500")} />
                            {community.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>From: {community.ownerId?.email || "Unknown"}</span>
                        </div>
                    </div>
                    <Badge variant="outline" className={cn(
                        "text-[10px] uppercase",
                        isHiddenMode ? "text-purple-400 border-purple-500/30" : "text-blue-500 border-blue-500/30"
                    )}>
                        Pending
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {community.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{community.description}</p>
                )}

                <div className="flex gap-2 pt-2">
                    <Button
                        onClick={handleAccept}
                        disabled={isLoading}
                        size="sm"
                        className="flex-1 gap-2 text-xs"
                    >
                        <Check className="h-3.5 w-3.5" />
                        Join
                    </Button>
                    <Button
                        onClick={handleDecline}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 text-xs hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20"
                    >
                        <X className="h-3.5 w-3.5" />
                        Decline
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
