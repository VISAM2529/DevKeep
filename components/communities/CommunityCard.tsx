"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Clock, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface CommunityCardProps {
    community: {
        _id: string;
        name: string;
        description: string;
        members: any[];
        createdAt: string;
    };
}

export function CommunityCard({ community }: CommunityCardProps) {
    const { toast } = useToast();
    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    useEffect(() => {
        checkAttendanceStatus();
    }, [community._id]);

    const checkAttendanceStatus = async () => {
        try {
            const res = await fetch(`/api/communities/${community._id}/attendance/status`);
            if (res.ok) {
                const data = await res.json();
                setIsActive(data.isActive);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleClockAction = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setLoading(true);
        try {
            const res = await fetch(`/api/communities/${community._id}/attendance`, {
                method: "POST",
            });

            if (!res.ok) throw new Error("Failed to process attendance");

            const data = await res.json();

            toast({
                title: data.action === "clockIn" ? "Clocked In" : "Clocked Out",
                description: data.message,
            });

            setIsActive(data.action === "clockIn");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="group relative overflow-hidden transition-all hover:bg-secondary/20 border-border/40 bg-card p-6 rounded-xl flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
                <div className="rounded-lg bg-primary/10 p-2.5">
                    <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                    {!checkingStatus && (
                        <Badge
                            variant={isActive ? "default" : "secondary"}
                            className="text-xs font-normal gap-1"
                        >
                            <Clock className="h-3 w-3" />
                            {isActive ? "Active" : "Inactive"}
                        </Badge>
                    )}
                    <Badge variant="outline" className="text-xs font-normal">
                        {community.members.length} member{community.members.length !== 1 && "s"}
                    </Badge>
                </div>
            </div>

            <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {community.name}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-2">
                    {community.description || "No description provided."}
                </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                    Created {formatDistanceToNow(new Date(community.createdAt))} ago
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        variant={isActive ? "destructive" : "default"}
                        size="sm"
                        className="gap-1.5 h-8 px-3"
                        onClick={handleClockAction}
                        disabled={loading || checkingStatus}
                    >
                        {isActive ? (
                            <>
                                <LogOut className="h-3.5 w-3.5" />
                                Clock Out
                            </>
                        ) : (
                            <>
                                <LogIn className="h-3.5 w-3.5" />
                                Clock In
                            </>
                        )}
                    </Button>
                    <Link href={`/communities/${community._id}`}>
                        <Button variant="ghost" size="sm" className="gap-2 h-8 px-2">
                            Enter
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                </div>
            </div>
        </Card>
    );
}
