"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Calendar as CalendarIcon } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CreateTaskDialogProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    collaborators: any[];
    onSuccess: () => void;
    task?: any; // Optional task for editing
}

export function CreateTaskDialog({
    isOpen,
    onClose,
    projectId,
    collaborators,
    onSuccess,
    task,
}: CreateTaskDialogProps) {
    const { toast } = useToast();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("To Do");
    const [priority, setPriority] = useState("Medium");
    const [assigneeId, setAssigneeId] = useState<string>("");
    const [deadline, setDeadline] = useState<Date | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title || "");
            setDescription(task.description || "");
            setStatus(task.status || "To Do");
            setPriority(task.priority || "Medium");
            // Handle populated assignee
            setAssigneeId(typeof task.assigneeId === 'object' ? task.assigneeId?._id : (task.assigneeId || ""));
            setDeadline(task.deadline ? new Date(task.deadline) : undefined);
        } else {
            // Reset for new task
            setTitle("");
            setDescription("");
            setStatus("To Do");
            setPriority("Medium");
            setAssigneeId("");
            setDeadline(undefined);
        }
    }, [task, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsLoading(true);
        try {
            const url = task
                ? `/api/projects/${projectId}/tasks/${task._id}`
                : `/api/projects/${projectId}/tasks`;

            const method = task ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    status,
                    priority,
                    deadline: deadline ? deadline.toISOString() : undefined,
                    assigneeId: assigneeId || undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Failed to ${task ? "update" : "create"} task`);
            }

            toast({
                title: task ? "Task Updated" : "Task Created",
                description: task ? "Task details have been updated." : "New task added to board."
            });
            onSuccess();
            onClose();
            if (!task) {
                setTitle("");
                setDescription("");
                setStatus("To Do");
                setPriority("Medium");
                setAssigneeId("");
                setDeadline(undefined);
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
                    <DialogDescription>
                        {task ? "Update task details." : "Add a task to the project board."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                            placeholder="Task title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            placeholder="Details about the task..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="To Do">To Do</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Done">Done</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Assignee</Label>
                            <Select value={assigneeId} onValueChange={setAssigneeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Unassigned" />
                                </SelectTrigger>
                                <SelectContent>
                                    {collaborators.map((user) => (
                                        <SelectItem key={user._id} value={user._id}>
                                            {user.name || user.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 flex flex-col pt-2">
                            <Label className="mb-2">Deadline</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !deadline && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={deadline}
                                        onSelect={setDeadline}
                                        initialFocus
                                        classNames={{
                                            head_cell: "w-8 font-normal text-[0.8rem] text-muted-foreground",
                                            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                            day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isLoading || !title.trim()}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {task ? "Save Changes" : "Create Task"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
