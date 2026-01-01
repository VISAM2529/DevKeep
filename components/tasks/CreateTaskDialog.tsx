"use client";

import { useState } from "react";
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
    collaborators: any[]; // List of potential assignees
    onSuccess: () => void;
}

export function CreateTaskDialog({
    isOpen,
    onClose,
    projectId,
    collaborators, // Expects full User objects or { email, name, _id } if possible?
    // Project.sharedWith is { email, role... }. We need actual Users to assign ID.
    // The API allows getting collaborators with user details? GET /api/projects/:id usually returns project.
    // To assign properly, we need User IDs. `sharedWith` only has emails.
    // We might need to fetch `User` objects matching these emails or rely on `CollaboratorModal` logic.
    // Ideally, `GET /api/projects/:id` should populate `sharedWith.userId` if we changed schema to use Ref.
    // But schema uses `email`.
    // WORKAROUND: We can search users by email OR just assign by email and backend resolves?
    // Backend `Task` model expects `assigneeId` (ObjectId).
    // Backend POST `tasks` expects `assigneeId`.
    // So frontend must send `assigneeId`.
    // Does `Project` populate anything? No, it's just strings.
    // We need a way to get User IDs from the collaborator emails.
    // Maybe a new API endpoint `GET /api/projects/:id/users` to get full profiles of team?
    // OR update specific GET project to return mapped users.
    onSuccess,
}: CreateTaskDialogProps) {
    const { toast } = useToast();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("To Do");
    const [priority, setPriority] = useState("Medium");
    const [assigneeId, setAssigneeId] = useState<string>("");
    const [deadline, setDeadline] = useState<Date | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);

    // Temp: We need a way to select assignees.
    // If we only have emails, we can't select ID easily. 
    // I'll assume for this turn that `collaborators` passed in will be specialized objects from the parent page 
    // which might need to fetch them.
    // Actually, let's implement a `useProjectUsers` hook or fetching logic in parent.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/tasks`, {
                method: "POST",
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
                throw new Error(data.error || "Failed to create task");
            }

            toast({ title: "Task Created", description: "New task added to board." });
            onSuccess();
            onClose();
            // Reset form
            setTitle("");
            setDescription("");
            setStatus("To Do");
            setPriority("Medium");
            setAssigneeId("");
            setDeadline(undefined);
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
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>Add a task to the project board.</DialogDescription>
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
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={deadline}
                                        onSelect={setDeadline}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isLoading || !title.trim()}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Task
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
