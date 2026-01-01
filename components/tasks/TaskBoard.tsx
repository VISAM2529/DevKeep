"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Calendar, User as UserIcon, LayoutGrid, BarChart3 } from "lucide-react";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { TaskTimeline } from "./TaskTimeline";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useToast } from "@/hooks/use-toast";

interface TaskBoardProps {
    projectId: string;
}

export function TaskBoard({ projectId }: TaskBoardProps) {
    const { toast } = useToast();
    const [tasks, setTasks] = useState<any[]>([]);
    const [team, setTeam] = useState<any[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"board" | "timeline">("board");

    const fetchTasks = async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}/tasks`);
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTeam = async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}/team`);
            if (res.ok) {
                const data = await res.json();
                setTeam(data);
            }
        } catch (e) { console.error(e) }
    };

    useEffect(() => {
        fetchTasks();
        fetchTeam();
    }, [projectId]);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newStatus = destination.droppableId;

        // Optimistic update
        const updatedTasks = tasks.map(t => {
            if (t._id === draggableId) {
                return { ...t, status: newStatus };
            }
            return t;
        });
        setTasks(updatedTasks);

        // Call API
        try {
            const res = await fetch(`/api/projects/${projectId}/tasks/${draggableId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error("Failed to update status");

            // Optional: refresh to get verified state
            // fetchTasks(); 
        } catch (error) {
            toast({ variant: "destructive", title: "Update failed", description: "Reverting change." });
            fetchTasks(); // Revert
        }
    };

    const columns = [
        { id: "To Do", title: "To Do", color: "bg-secondary/50" },
        { id: "In Progress", title: "In Progress", color: "bg-blue-500/10" },
        { id: "Done", title: "Done", color: "bg-green-500/10" },
    ];

    if (isLoading) return <div>Loading board...</div>;

    return (
        <div className="h-full flex flex-col space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                    <h3 className="text-base md:text-lg font-semibold tracking-tight text-foreground">Task Management</h3>
                    <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg w-fit">
                        <Button
                            size="sm"
                            variant={viewMode === "board" ? "default" : "ghost"}
                            onClick={() => setViewMode("board")}
                            className="h-8 md:h-7 px-3 gap-1.5 text-xs font-medium transition-all"
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                            Board
                        </Button>
                        <Button
                            size="sm"
                            variant={viewMode === "timeline" ? "default" : "ghost"}
                            onClick={() => setViewMode("timeline")}
                            className="h-8 md:h-7 px-3 gap-1.5 text-xs font-medium transition-all"
                        >
                            <BarChart3 className="h-3.5 w-3.5" />
                            Timeline
                        </Button>
                    </div>
                </div>
                <Button
                    size="sm"
                    onClick={() => setIsCreateOpen(true)}
                    className="gap-2 h-9 md:h-8 w-full sm:w-auto font-medium"
                >
                    <Plus className="h-4 w-4" />
                    New Task
                </Button>
            </div>

            {viewMode === "board" ? (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 min-h-[500px]">
                        {columns.map((col) => (
                            <div key={col.id} className={`flex flex-col rounded-xl border border-border/40 ${col.color} p-3 md:p-4`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-sm">{col.title}</h4>
                                    <Badge variant="secondary" className="text-xs">
                                        {tasks.filter(t => t.status === col.id).length}
                                    </Badge>
                                </div>

                                <Droppable droppableId={col.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`flex-1 space-y-3 min-h-[100px] transition-colors rounded-lg ${snapshot.isDraggingOver ? "bg-background/50 ring-2 ring-primary/20" : ""
                                                }`}
                                        >
                                            {tasks
                                                .filter((t) => t.status === col.id)
                                                .map((task, index) => (
                                                    <Draggable key={task._id} draggableId={task._id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <Card
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all ${snapshot.isDragging ? "shadow-lg rotate-2 ring-2 ring-primary" : ""
                                                                    }`}
                                                                style={provided.draggableProps.style}
                                                            >
                                                                <CardHeader className="p-3 pb-2 space-y-1">
                                                                    <div className="flex justify-between items-start">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={`text-[10px] px-1.5 py-0 h-5 ${task.priority === 'High' ? 'text-red-500 border-red-500/20 bg-red-500/10' :
                                                                                task.priority === 'Medium' ? 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10' :
                                                                                    'text-blue-500 border-blue-500/20 bg-blue-500/10'
                                                                                }`}
                                                                        >
                                                                            {task.priority}
                                                                        </Badge>
                                                                    </div>
                                                                    <CardTitle className="text-sm font-medium leading-tight">
                                                                        {task.title}
                                                                    </CardTitle>
                                                                </CardHeader>
                                                                <CardContent className="p-3 pt-0 pb-3">
                                                                    {task.description && (
                                                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                                                                            {task.description}
                                                                        </p>
                                                                    )}
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            {task.assigneeId ? (
                                                                                <Avatar className="h-5 w-5">
                                                                                    <AvatarImage src={task.assigneeId.image} />
                                                                                    <AvatarFallback className="text-[8px]">{getInitials(task.assigneeId.name)}</AvatarFallback>
                                                                                </Avatar>
                                                                            ) : (
                                                                                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                                                                                    <UserIcon className="h-3 w-3 text-muted-foreground" />
                                                                                </div>
                                                                            )}
                                                                            {task.deadline && (
                                                                                <div className="flex items-center text-[10px] text-muted-foreground">
                                                                                    <Calendar className="h-3 w-3 mr-1" />
                                                                                    {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        )}
                                                    </Draggable>
                                                ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            ) : (
                <TaskTimeline tasks={tasks} />
            )}

            <CreateTaskDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                projectId={projectId}
                collaborators={team}
                onSuccess={fetchTasks}
            />
        </div>
    );
}
