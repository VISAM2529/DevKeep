"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, addMonths } from "date-fns";

interface TaskTimelineProps {
    tasks: any[];
}

export function TaskTimeline({ tasks }: TaskTimelineProps) {
    const timelineData = useMemo(() => {
        if (tasks.length === 0) return null;

        // Find date range
        const dates = tasks.map(t => [
            t.createdAt ? new Date(t.createdAt) : new Date(),
            t.deadline ? new Date(t.deadline) : new Date()
        ]).flat();

        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

        // Extend range to full months
        const start = startOfMonth(minDate);
        const end = endOfMonth(addMonths(maxDate, 1));

        const totalDays = differenceInDays(end, start);
        const days = eachDayOfInterval({ start, end });

        return { start, end, totalDays, days };
    }, [tasks]);

    if (!timelineData || tasks.length === 0) {
        return (
            <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                No tasks to display in timeline view
            </div>
        );
    }

    const { start, totalDays, days } = timelineData;

    const getTaskPosition = (task: any) => {
        const taskStart = task.createdAt ? new Date(task.createdAt) : new Date();
        const taskEnd = task.deadline ? new Date(task.deadline) : new Date(taskStart.getTime() + 7 * 24 * 60 * 60 * 1000);

        const startOffset = differenceInDays(taskStart, start);
        const duration = differenceInDays(taskEnd, taskStart) || 1;

        return {
            left: `${(startOffset / totalDays) * 100}%`,
            width: `${(duration / totalDays) * 100}%`,
        };
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "High": return "bg-red-500";
            case "Medium": return "bg-yellow-500";
            default: return "bg-blue-500";
        }
    };

    const getStatusOpacity = (status: string) => {
        switch (status) {
            case "Done": return "opacity-60";
            case "In Progress": return "opacity-90";
            default: return "opacity-100";
        }
    };

    return (
        <Card className="p-6">
            <ScrollArea className="w-full">
                <div className="min-w-[1200px]">
                    {/* Header with months */}
                    <div className="flex border-b border-border/40 pb-2 mb-4">
                        <div className="w-48 font-semibold text-sm">Task</div>
                        <div className="flex-1 relative">
                            {Array.from(new Set(days.map(d => format(d, 'MMM yyyy')))).map((month, i) => {
                                const monthDays = days.filter(d => format(d, 'MMM yyyy') === month);
                                const width = (monthDays.length / totalDays) * 100;
                                return (
                                    <div
                                        key={i}
                                        className="inline-block text-center text-xs font-medium border-r border-border/20 px-2"
                                        style={{ width: `${width}%` }}
                                    >
                                        {month}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Timeline grid */}
                    <div className="space-y-3">
                        {tasks.map((task) => {
                            const position = getTaskPosition(task);
                            const createdDate = task.createdAt ? new Date(task.createdAt) : new Date();
                            const completedDate = task.completedAt ? new Date(task.completedAt) : null;
                            const completionDays = completedDate ? differenceInDays(completedDate, createdDate) : null;

                            return (
                                <div key={task._id} className="flex items-center group">
                                    <div className="w-48 pr-4">
                                        <div className="text-sm font-medium truncate">{task.title}</div>
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                                                {task.status}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] px-1 py-0 ${task.priority === 'High' ? 'border-red-500/20 text-red-500' :
                                                    task.priority === 'Medium' ? 'border-yellow-500/20 text-yellow-500' :
                                                        'border-blue-500/20 text-blue-500'
                                                    }`}
                                            >
                                                {task.priority}
                                            </Badge>
                                            {completionDays !== null && (
                                                <Badge variant="outline" className="text-[10px] px-1 py-0 bg-green-500/10 border-green-500/20 text-green-600">
                                                    ✓ {completionDays}d
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 relative h-12 bg-secondary/20 rounded-lg">
                                        {/* Grid lines */}
                                        <div className="absolute inset-0 flex">
                                            {days.filter((_, i) => i % 7 === 0).map((day, i) => (
                                                <div
                                                    key={i}
                                                    className="border-r border-border/10"
                                                    style={{ width: `${(7 / totalDays) * 100}%` }}
                                                />
                                            ))}
                                        </div>

                                        {/* Task bar */}
                                        <div
                                            className={`absolute top-2 h-8 rounded-md ${getPriorityColor(task.priority)} ${getStatusOpacity(task.status)} transition-all group-hover:scale-105 group-hover:shadow-lg flex items-center px-3 justify-between`}
                                            style={position}
                                        >
                                            <span className="text-white text-xs font-medium truncate">
                                                {task.assigneeId?.name || "Unassigned"}
                                            </span>
                                            {completionDays !== null && (
                                                <span className="text-white text-[10px] font-semibold bg-black/20 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
                                                    {completionDays}d
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Today indicator */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-primary/50 pointer-events-none"
                        style={{
                            left: `${48 * 4 + (differenceInDays(new Date(), start) / totalDays) * 100}%`
                        }}
                    >
                        <div className="absolute -top-6 -left-8 text-xs font-medium text-primary">
                            Today
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </Card>
    );
}
