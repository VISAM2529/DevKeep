"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    FolderKanban,
    Lock,
    Terminal,
    FileText,
    ArrowUpRight,
    Plus,
    Activity,
    ChevronRight,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { InvitationCard } from "@/components/projects/InvitationCard";
import { MyTasks } from "@/components/dashboard/MyTasks";

interface DashboardStats {
    counts: {
        projects: number;
        credentials: number;
        commands: number;
        notes: number;
        pendingInvitations?: number;
    };
    recentItems: any[];
}

export default function DashboardPage() {
    const { data: session, status: authStatus } = useSession();
    const { toast } = useToast();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/dashboard/stats");
            if (!res.ok) throw new Error("Synchronization failure");
            const data = await res.json();
            setStats(data);

            // Fetch pending invitations
            const projectsRes = await fetch("/api/projects");
            if (projectsRes.ok) {
                const projectsData = await projectsRes.json();
                setPendingInvitations(projectsData.pendingInvitations || []);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Sync Error",
                description: "Failed to reload system statistics.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authStatus === "authenticated") {
            fetchStats();
        }
    }, [authStatus]);

    if (authStatus === "loading" || loading) {
        return (
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
                <div className="space-y-4">
                    <Skeleton className="h-8 w-64 rounded-lg" />
                    <Skeleton className="h-4 w-96 rounded-lg" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    const statCards = [
        { label: "Active Projects", val: stats?.counts?.projects || 0, icon: FolderKanban, href: "/projects" },
        { label: "Credentials", val: stats?.counts?.credentials || 0, icon: Lock, href: "/credentials" },
        { label: "Snippets", val: stats?.counts?.commands || 0, icon: Terminal, href: "/commands" },
        { label: "Documents", val: stats?.counts?.notes || 0, icon: FileText, href: "/notes" },
    ];

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 min-h-full pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                        Overview
                    </h1>
                    <p className="text-muted-foreground text-xs md:text-sm">
                        Welcome back, {session?.user?.name?.split(" ")[0] || "Operator"}. Here is your workspace summary.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/projects/new" className="w-full md:w-auto">
                        <Button className="w-full h-9 md:h-10 px-4 gap-2 text-xs md:text-sm font-medium">
                            <Plus className="h-4 w-4" /> Initialize Project
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, i) => (
                    <Link key={i} href={stat.href}>
                        <Card className="hover:border-white/20 transition-all cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
                                <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                                <stat.icon className="h-3 w-3 md:h-4 md:w-4 text-white/50" />
                            </CardHeader>
                            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                                <div className="text-lg md:text-2xl font-bold text-white">{stat.val}</div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Pending Invitations Alert */}
            {pendingInvitations.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold tracking-tight">Pending Invitations</h2>
                        <span className="h-5 px-2 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium border border-yellow-500/20">
                            {pendingInvitations.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingInvitations.slice(0, 3).map((project) => (
                            <InvitationCard
                                key={project._id}
                                project={project}
                                onUpdate={fetchStats}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity & Quick Tools & My Tasks */}
            <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
                <Card className="lg:col-span-2 order-2 lg:order-1">
                    <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6 pb-2 md:pb-4">
                        <div>
                            <CardTitle className="text-base md:text-lg font-semibold">Recent Activity</CardTitle>
                            <CardDescription className="text-xs md:text-sm">Your latest workspace actions</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-2 md:p-6 pt-0 md:pt-0">
                        {stats?.recentItems && stats.recentItems.length > 0 ? (
                            <div className="space-y-1">
                                {stats.recentItems.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 md:p-3 rounded-lg hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="h-7 w-7 md:h-8 md:w-8 rounded-md bg-white/5 flex items-center justify-center border border-white/5">
                                                {item.type === "Project" && <FolderKanban className="h-3.5 w-3.5 md:h-4 md:w-4 text-white/70" />}
                                                {item.type === "Credential" && <Lock className="h-3.5 w-3.5 md:h-4 md:w-4 text-white/70" />}
                                                {item.type === "Command" && <Terminal className="h-3.5 w-3.5 md:h-4 md:w-4 text-white/70" />}
                                                {item.type === "Note" && <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-white/70" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs md:text-sm font-medium text-white truncate max-w-[120px] md:max-w-none">{item.name}</div>
                                                <div className="text-[10px] md:text-xs text-muted-foreground">{item.type}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1.5 shrink-0">
                                                {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center space-y-3 md:space-y-4">
                                <Activity className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground/50" />
                                <div className="space-y-1">
                                    <h3 className="text-xs md:text-sm font-medium text-muted-foreground">No recent activity</h3>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="order-1 lg:order-2">
                    <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
                        <CardTitle className="text-base md:text-lg font-semibold">Quick Actions</CardTitle>
                        <CardDescription className="text-xs md:text-sm">Common tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 md:space-y-3 p-4 md:p-6 pt-0 md:pt-0">
                        {[
                            { label: "Add Credential", icon: Lock, href: "/credentials" },
                            { label: "Save Snippet", icon: Terminal, href: "/commands" },
                            { label: "Write Note", icon: FileText, href: "/notes/new" },
                        ].map((tool, i) => (
                            <Link key={i} href={tool.href}>
                                <div className="flex items-center justify-between p-2 md:p-3 rounded-lg border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-7 w-7 md:h-8 md:w-8 rounded-md bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                            <tool.icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-white/70" />
                                        </div>
                                        <span className="text-xs md:text-sm font-medium text-white/80 group-hover:text-white">{tool.label}</span>
                                    </div>
                                    <ArrowUpRight className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground group-hover:text-white transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* My Tasks Section */}
            <MyTasks />
        </div>
    );
}
