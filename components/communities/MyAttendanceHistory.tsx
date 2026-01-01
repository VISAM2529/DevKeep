"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface MyAttendanceHistoryProps {
    communityId: string;
}

export function MyAttendanceHistory({ communityId }: MyAttendanceHistoryProps) {
    const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMyAttendance = async (selectedPeriod: string) => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/communities/${communityId}/attendance/analytics?period=${selectedPeriod}`
            );

            if (res.ok) {
                const data = await res.json();
                // Extract only current user's records
                if (data.analytics && data.analytics.length > 0) {
                    setRecords(data.analytics[0].records || []);
                } else {
                    setRecords([]);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyAttendance(period);
    }, [communityId, period]);

    const getAttendanceStatus = (hours: number) => {
        if (hours >= 9) return { label: "Full Day", color: "bg-green-500/10 border-green-500/20 text-green-600" };
        if (hours >= 4) return { label: "Half Day", color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-600" };
        return { label: "Absent", color: "bg-red-500/10 border-red-500/20 text-red-600" };
    };

    const totalHours = records.reduce((sum, r) => sum + r.hours, 0);
    const fullDays = records.filter(r => r.hours >= 9).length;
    const halfDays = records.filter(r => r.hours >= 4 && r.hours < 9).length;
    const absentDays = records.filter(r => r.hours < 4).length;

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">My Attendance History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-secondary/20 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-base md:text-lg font-semibold tracking-tight text-foreground">My Attendance History</CardTitle>
                        <CardDescription className="text-[10px] md:text-sm">View your work hours and attendance records</CardDescription>
                    </div>
                    <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full md:w-auto">
                        <TabsList className="grid grid-cols-3 w-full md:w-[300px] h-9 md:h-10 bg-secondary/50 p-1">
                            <TabsTrigger value="daily" className="text-[10px] md:text-xs font-medium">Daily</TabsTrigger>
                            <TabsTrigger value="weekly" className="text-[10px] md:text-xs font-medium">Weekly</TabsTrigger>
                            <TabsTrigger value="monthly" className="text-[10px] md:text-xs font-medium">Monthly</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border/20">
                        <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total Hours</div>
                        <div className="text-xl font-bold text-primary">{totalHours.toFixed(1)}h</div>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                        <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Full Days</div>
                        <div className="text-xl font-bold text-green-500">{fullDays}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                        <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Half Days</div>
                        <div className="text-xl font-bold text-yellow-500">{halfDays}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                        <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Absent</div>
                        <div className="text-xl font-bold text-red-500">{absentDays}</div>
                    </div>
                </div>

                {/* Records List */}
                {records.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                            {records.map((record, idx) => {
                                const status = getAttendanceStatus(record.hours);
                                return (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-2.5 md:p-3 rounded-lg bg-secondary/20 border border-border/20 hover:border-primary/50 transition-all"
                                    >
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                                            <div>
                                                <div className="text-[11px] md:text-sm font-medium">{record.date}</div>
                                                {record.clockIn && record.clockOut && (
                                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-2.5 w-2.5" />
                                                        {format(new Date(record.clockIn), "h:mm a")} - {format(new Date(record.clockOut), "h:mm a")}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={`text-[9px] md:text-[10px] px-1.5 py-0 ${status.color}`}>
                                                {status.label}
                                            </Badge>
                                            <div className="text-xs md:text-sm font-bold text-primary min-w-[40px] md:min-w-[50px] text-right">
                                                {record.hours}h
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                        <Clock className="h-8 w-8 text-muted-foreground/50" />
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-muted-foreground">No attendance records</h3>
                            <p className="text-xs text-muted-foreground/70">
                                Clock in to start tracking your attendance
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
