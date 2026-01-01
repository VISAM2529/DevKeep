"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Calendar, CheckCircle2, Circle, Clock } from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

export function MyTasks() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await fetch("/api/tasks/me");
                if (res.ok) {
                    const data = await res.json();
                    setTasks(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Done":
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case "In Progress":
                return <Clock className="h-4 w-4 text-blue-500" />;
            default:
                return <Circle className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "High":
                return "border-red-500/20 text-red-500 bg-red-500/10";
            case "Medium":
                return "border-yellow-500/20 text-yellow-500 bg-yellow-500/10";
            default:
                return "border-blue-500/20 text-blue-500 bg-blue-500/10";
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">My Tasks</CardTitle>
                    <CardDescription>Tasks assigned to you</CardDescription>
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
                        <CardTitle className="text-lg font-semibold">My Tasks</CardTitle>
                        <CardDescription>Tasks assigned to you across all projects</CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                        {tasks.length}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                        <CheckCircle2 className="h-10 w-10 text-muted-foreground/50" />
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-muted-foreground">No tasks assigned</h3>
                            <p className="text-xs text-muted-foreground/70">You're all caught up!</p>
                        </div>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-3">
                            {tasks.map((task) => (
                                <Link
                                    key={task._id}
                                    href={`/projects/${task.projectId?._id}?tab=tasks`}
                                    className="block"
                                >
                                    <div className="p-3 rounded-lg border border-border/40 hover:border-primary/50 hover:bg-secondary/20 transition-all group">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(task.status)}
                                                    <h4 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                                                        {task.title}
                                                    </h4>
                                                </div>
                                                {task.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-1 pl-6">
                                                        {task.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 pl-6 flex-wrap">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] px-1.5 py-0 h-5 ${getPriorityColor(task.priority)}`}
                                                    >
                                                        {task.priority}
                                                    </Badge>
                                                    {task.projectId && (
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                                            {task.projectId.name}
                                                        </Badge>
                                                    )}
                                                    {task.deadline && (
                                                        <div className="flex items-center text-[10px] text-muted-foreground gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(task.deadline).toLocaleDateString(undefined, {
                                                                month: "short",
                                                                day: "numeric",
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {task.creatorId && (
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={task.creatorId.image} />
                                                    <AvatarFallback className="text-[10px]">
                                                        {getInitials(task.creatorId.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
