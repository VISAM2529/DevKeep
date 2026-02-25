"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle2, PlusCircle, ShieldAlert, FileEdit, UserPlus, FileText, Lock, Terminal, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ActivityItem {
    _id: string;
    userId: {
        _id: string;
        name: string;
        image?: string;
    };
    userName: string;
    action: string;
    type: "task" | "command" | "credential" | "note" | "member" | "system";
    details?: string;
    createdAt: string;
}

interface ProjectActivityProps {
    projectId: string;
}

export function ProjectActivity({ projectId }: ProjectActivityProps) {
    const { data: session } = useSession();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<"ALL" | "TEAM" | "MY">("ALL");
    const [userRole, setUserRole] = useState<string | null>(null);

    const fetchActivity = async (currentFilter: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/activity?filter=${currentFilter}`);
            if (res.ok) {
                const data = await res.json();
                setActivities(data);
            }
        } catch (error) {
            console.error("Failed to fetch activity:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserRole = async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}`);
            if (res.ok) {
                const data = await res.json();
                const project = data.project || data;

                if (project.userId === session?.user?.id || (typeof project.userId === 'object' && project.userId._id === session?.user?.id)) {
                    setUserRole("Owner");
                } else {
                    const collab = project.sharedWith?.find((c: any) => c.email === session?.user?.email);
                    setUserRole(collab?.role || "Member");
                }
            }
        } catch (error) {
            console.error("Failed to fetch user role:", error);
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchUserRole();
        }
    }, [projectId, session]);

    useEffect(() => {
        fetchActivity(filter);
    }, [projectId, filter]);

    const isAdmin = userRole === "Owner" || userRole === "Admin" || userRole === "Project Lead" || userRole === "Community Admin";

    // Role-based visibility and default filter enforcement
    useEffect(() => {
        if (userRole) {
            if (!isAdmin) {
                setFilter("MY");
            } else {
                setFilter("ALL");
            }
        }
    }, [userRole, isAdmin]);

    const groupActivitiesByDate = (items: ActivityItem[]) => {
        const groups: { [key: string]: ActivityItem[] } = {};
        const today = new Date().toLocaleDateString();
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

        items.forEach(item => {
            const date = new Date(item.createdAt).toLocaleDateString();
            let label = date;
            if (date === today) label = "Today";
            else if (date === yesterday) label = "Yesterday";
            else label = format(new Date(item.createdAt), "MMMM d, yyyy");

            if (!groups[label]) groups[label] = [];
            groups[label].push(item);
        });

        return groups;
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "task": return <CheckCircle2 className="h-3.5 w-3.5" />;
            case "command": return <Terminal className="h-3.5 w-3.5" />;
            case "credential": return <Lock className="h-3.5 w-3.5" />;
            case "note": return <FileText className="h-3.5 w-3.5" />;
            case "member": return <UserPlus className="h-3.5 w-3.5" />;
            default: return <Clock className="h-3.5 w-3.5" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "task": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
            case "command": return "text-purple-500 bg-purple-500/10 border-purple-500/20";
            case "credential": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
            case "note": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
            case "member": return "text-pink-500 bg-pink-500/10 border-pink-500/20";
            default: return "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";
        }
    };

    const groupedActivities = groupActivitiesByDate(activities);

    return (
        <div className="space-y-8 py-6 max-w-4xl">
            {/* Header with Filter Tabs */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <h3 className="text-sm font-semibold text-white">Project Activity</h3>
                </div>

                {isAdmin ? (
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                        {(["ALL", "TEAM", "MY"] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilter(t)}
                                className={cn(
                                    "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                                    filter === t
                                        ? "bg-white/10 text-white shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                ) : userRole && (
                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        MY ACTIVITY
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground mt-4 font-medium italic">Scanning project timeline...</p>
                </div>
            ) : Object.keys(groupedActivities).length > 0 ? (
                <div className="space-y-12">
                    {Object.entries(groupedActivities).map(([date, items]) => (
                        <div key={date} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 whitespace-nowrap">{date}</h4>
                                <div className="h-px w-full bg-white/5" />
                            </div>
                            <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                                {items.map((activity, index) => (
                                    <div
                                        key={activity._id}
                                        className="relative pl-12 group animate-in fade-in slide-in-from-bottom-4 duration-500"
                                        style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                                    >
                                        {/* Timeline Node */}
                                        <div className={cn(
                                            "absolute left-0 top-0 h-10 w-10 rounded-xl border border-white/5 flex items-center justify-center z-10 transition-all group-hover:scale-110",
                                            getTypeColor(activity.type).split(' ')[1] // Get background color
                                        )}>
                                            <div className={cn("transition-colors", getTypeColor(activity.type).split(' ')[0])}>
                                                {getIcon(activity.type)}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Avatar className="h-5 w-5 border border-white/10">
                                                            <AvatarImage src={activity.userId?.image || ""} />
                                                            <AvatarFallback className="bg-zinc-800 text-[8px] text-zinc-400">
                                                                {activity.userName.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm text-white font-bold">{activity.userName}</span>
                                                        <span className="text-sm text-zinc-400">{activity.action}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-600 uppercase tracking-tighter">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(activity.createdAt), "h:mm a")}
                                                    </div>
                                                </div>

                                                <Badge variant="outline" className={cn(
                                                    "text-[9px] font-black uppercase tracking-widest h-5 px-1.5 shrink-0",
                                                    getTypeColor(activity.type)
                                                )}>
                                                    {activity.type}
                                                </Badge>
                                            </div>

                                            {activity.details && (
                                                <div className="mt-1 p-3 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-zinc-500 italic leading-relaxed">
                                                    {activity.details}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                    <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mb-6">
                        <Clock className="h-6 w-6 text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Event Log Empty</h3>
                    <p className="text-sm text-zinc-500 mt-1 max-w-[240px] text-center leading-relaxed">
                        {filter === "MY"
                            ? "You haven't performed any activities in this project yet."
                            : filter === "TEAM"
                                ? "No activities from other team members yet."
                                : "No significant activities recorded for this project yet."}
                    </p>
                </div>
            )}
        </div>
    );
}
