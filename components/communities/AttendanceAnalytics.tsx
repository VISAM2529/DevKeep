"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Calendar, Clock, TrendingUp, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AttendanceAnalyticsProps {
    communityId: string;
}

export function AttendanceAnalytics({ communityId }: AttendanceAnalyticsProps) {
    const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = async (selectedPeriod: string) => {
        setLoading(true);
        setError(null);
        try {
            console.log(`Fetching analytics for community ${communityId}, period: ${selectedPeriod}`);
            const res = await fetch(
                `/api/communities/${communityId}/attendance/analytics?period=${selectedPeriod}`
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            console.log('Analytics data received:', data);
            setAnalytics(data);
        } catch (error: any) {
            console.error('Analytics fetch error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics(period);
    }, [communityId, period]);

    const handlePeriodChange = (newPeriod: string) => {
        setPeriod(newPeriod as "daily" | "weekly" | "monthly");
    };

    const getAttendanceStatus = (hours: number) => {
        if (hours >= 9) return { label: "Full Day", color: "bg-green-500/10 border-green-500/20 text-green-600" };
        if (hours >= 4) return { label: "Half Day", color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-600" };
        return { label: "Absent", color: "bg-red-500/10 border-red-500/20 text-red-600" };
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Attendance Analytics</CardTitle>
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

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Attendance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                        <TrendingUp className="h-10 w-10 text-destructive/50" />
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-destructive">Error loading analytics</h3>
                            <p className="text-xs text-muted-foreground">{error}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.summary?.totalMembers || 0}</div>
                        <p className="text-xs text-muted-foreground">Active in {period} period</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.summary?.totalHours || 0}h</div>
                        <p className="text-xs text-muted-foreground">Combined work hours</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Period</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium">
                            {analytics?.startDate} to {analytics?.endDate}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{period} view</p>
                    </CardContent>
                </Card>
            </div>

            {/* Member Breakdown */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold">Member Breakdown</CardTitle>
                            <CardDescription>Individual attendance statistics</CardDescription>
                        </div>
                        <Tabs value={period} onValueChange={handlePeriodChange} className="w-full md:w-auto">
                            <TabsList className="grid grid-cols-3 w-full">
                                <TabsTrigger value="daily" className="text-xs">Daily</TabsTrigger>
                                <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
                                <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
                <CardContent>
                    {analytics?.analytics && analytics.analytics.length > 0 ? (
                        <ScrollArea className="h-[500px]">
                            <div className="space-y-4">
                                {analytics.analytics.map((member: any, index: number) => {
                                    const fullDays = member.records.filter((r: any) => r.hours >= 9).length;
                                    const halfDays = member.records.filter((r: any) => r.hours >= 4 && r.hours < 9).length;
                                    const absentDays = member.records.filter((r: any) => r.hours < 4).length;

                                    return (
                                        <div
                                            key={index}
                                            className="p-4 rounded-lg border border-border/40 hover:border-primary/50 transition-all"
                                        >
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={member.user?.image} />
                                                        <AvatarFallback>
                                                            {getInitials(member.user?.name || "U")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-medium">
                                                            {member.user?.name || "Unknown"}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground">
                                                            {member.user?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <div className="text-lg font-bold text-primary">
                                                        {member.totalHours}h
                                                    </div>
                                                    <div className="flex gap-1 flex-wrap justify-end">
                                                        <Badge variant="outline" className="text-[10px] bg-green-500/10 border-green-500/20 text-green-600">
                                                            {fullDays} Full
                                                        </Badge>
                                                        <Badge variant="outline" className="text-[10px] bg-yellow-500/10 border-yellow-500/20 text-yellow-600">
                                                            {halfDays} Half
                                                        </Badge>
                                                        <Badge variant="outline" className="text-[10px] bg-red-500/10 border-red-500/20 text-red-600">
                                                            {absentDays} Absent
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Daily Records Table */}
                                            {member.records && member.records.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-border/40">
                                                    <div className="text-[10px] md:text-xs font-medium text-muted-foreground mb-2 px-1">
                                                        Daily Attendance Records
                                                    </div>
                                                    <div className="space-y-1.5 md:space-y-2">
                                                        {member.records.map((record: any, idx: number) => {
                                                            const status = getAttendanceStatus(record.hours);
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="flex items-center justify-between p-1.5 md:p-2 rounded bg-secondary/20 border border-border/10"
                                                                >
                                                                    <div className="flex items-center gap-2 md:gap-3">
                                                                        <div className="text-[10px] md:text-xs font-medium min-w-[70px] md:min-w-[80px]">
                                                                            {record.date}
                                                                        </div>
                                                                        <Badge variant="outline" className={`text-[9px] md:text-[10px] px-1 md:px-2 ${status.color}`}>
                                                                            {status.label}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="text-[10px] md:text-xs font-semibold text-primary">
                                                                        {record.hours}h
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                            <TrendingUp className="h-10 w-10 text-muted-foreground/50" />
                            <div className="space-y-1">
                                <h3 className="text-sm font-medium text-muted-foreground">
                                    No attendance data
                                </h3>
                                <p className="text-xs text-muted-foreground/70">
                                    No members have clocked in during this period
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
