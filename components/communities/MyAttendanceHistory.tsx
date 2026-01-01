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
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold">My Attendance History</CardTitle>
                        <CardDescription>View your work hours and attendance records</CardDescription>
                    </div>
                    <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
                        <TabsList>
                            <TabsTrigger value="daily">Daily</TabsTrigger>
                            <TabsTrigger value="weekly">Weekly</TabsTrigger>
                            <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/20 border border-border/20">
                        <div className="text-xs text-muted-foreground mb-1">Total Hours</div>
                        <div className="text-lg font-bold text-primary">{totalHours.toFixed(1)}h</div>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="text-xs text-muted-foreground mb-1">Full Days</div>
                        <div className="text-lg font-bold text-green-600">{fullDays}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <div className="text-xs text-muted-foreground mb-1">Half Days</div>
                        <div className="text-lg font-bold text-yellow-600">{halfDays}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="text-xs text-muted-foreground mb-1">Absent</div>
                        <div className="text-lg font-bold text-red-600">{absentDays}</div>
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
                                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/20 hover:border-primary/50 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <div className="text-sm font-medium">{record.date}</div>
                                                {record.clockIn && record.clockOut && (
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(record.clockIn), "h:mm a")} - {format(new Date(record.clockOut), "h:mm a")}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                                                {status.label}
                                            </Badge>
                                            <div className="text-sm font-bold text-primary min-w-[50px] text-right">
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
