"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, LogIn, LogOut, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface AttendanceWidgetProps {
    communityId: string;
}

export function AttendanceWidget({ communityId }: AttendanceWidgetProps) {
    const { toast } = useToast();
    const [isActive, setIsActive] = useState(false);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showClockOutModal, setShowClockOutModal] = useState(false);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`/api/communities/${communityId}/attendance/status`);
            if (res.ok) {
                const data = await res.json();
                setIsActive(data.isActive);
                setActiveSession(data.session);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [communityId]);

    // Live timer update
    useEffect(() => {
        if (isActive) {
            const interval = setInterval(() => {
                setCurrentTime(new Date());
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isActive]);

    const handleClockAction = async () => {
        setProcessing(true);
        try {
            const res = await fetch(`/api/communities/${communityId}/attendance`, {
                method: "POST",
            });

            if (!res.ok) throw new Error("Failed to process attendance");

            const data = await res.json();

            toast({
                title: data.action === "clockIn" ? "Clocked In" : "Clocked Out",
                description: data.message,
            });

            // Refresh status
            await fetchStatus();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setProcessing(false);
            setShowClockOutModal(false);
        }
    };

    const calculateDuration = () => {
        if (!activeSession?.clockIn) return "0h 0m";

        const start = new Date(activeSession.clockIn);
        const diff = currentTime.getTime() - start.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-32 bg-secondary/20 rounded-lg animate-pulse" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-base md:text-lg font-semibold tracking-tight text-foreground">Attendance</CardTitle>
                        <CardDescription className="text-[10px] md:text-sm">Track your work hours</CardDescription>
                    </div>
                    <Badge variant={isActive ? "default" : "secondary"} className="gap-1.5 h-6 md:h-7 text-[10px] md:text-xs px-2 md:px-3">
                        <Clock className="h-3 w-3" />
                        {isActive ? "Active" : "Inactive"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isActive && activeSession && (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Current Session</span>
                            <Timer className="h-4 w-4 text-primary animate-pulse" />
                        </div>
                        <div className="text-2xl font-bold text-primary mb-1">
                            {calculateDuration()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Clocked in at {format(new Date(activeSession.clockIn), "h:mm a")}
                        </div>
                    </div>
                )}

                <Button
                    className="w-full gap-2 h-11"
                    variant={isActive ? "destructive" : "default"}
                    onClick={() => isActive ? setShowClockOutModal(true) : handleClockAction()}
                    disabled={processing}
                >
                    {isActive ? (
                        <>
                            <LogOut className="h-4 w-4" />
                            Clock Out
                        </>
                    ) : (
                        <>
                            <LogIn className="h-4 w-4" />
                            Clock In
                        </>
                    )}
                </Button>

                {!isActive && (
                    <div className="text-center text-sm text-muted-foreground">
                        Click "Clock In" to start tracking your time
                    </div>
                )}

                <ConfirmModal
                    isOpen={showClockOutModal}
                    onClose={() => setShowClockOutModal(false)}
                    onConfirm={handleClockAction}
                    isLoading={processing}
                    title="Finish Session?"
                    description="You are about to clock out. This will end your current attendance session and record your total work hours."
                    confirmText="Clock Out"
                    variant="primary"
                />
            </CardContent>
        </Card>
    );
}
