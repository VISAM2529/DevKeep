"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Check, X, Users, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface InvitationCardProps {
    project: {
        _id: string;
        name: string;
        description?: string;
        userId: { _id: string; email: string; name: string };
        sharedWith: { email: string; role: string; addedAt: Date; accepted: boolean }[];
    };
    onUpdate: () => void;
}

export function InvitationCard({ project, onUpdate }: InvitationCardProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleAccept = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${project._id}/accept`, {
                method: "POST",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to accept invitation");
            }

            toast({
                title: "Invitation Accepted",
                description: `You now have access to ${project.name}.`,
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
            const res = await fetch(`/api/projects/${project._id}/accept`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to decline invitation");
            }

            toast({
                title: "Invitation Declined",
                description: `Removed invitation for ${project.name}.`,
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
    const myInvitation = project.sharedWith?.find(s => !s.accepted);

    return (
        <Card className="border-yellow-500/20 bg-yellow-500/5 transition-all">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4 text-yellow-500" />
                            {project.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>From: {project.userId.email}</span>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 text-[10px] uppercase">
                        Pending
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                )}

                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] font-medium">
                        Role: {myInvitation?.role || "Collaborator"}
                    </Badge>
                    {myInvitation?.addedAt && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(myInvitation.addedAt).toLocaleDateString()}
                        </div>
                    )}
                </div>

                <div className="flex gap-2 pt-2">
                    <Button
                        onClick={handleAccept}
                        disabled={isLoading}
                        size="sm"
                        className="flex-1 gap-2 text-xs"
                    >
                        <Check className="h-3.5 w-3.5" />
                        Accept
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
