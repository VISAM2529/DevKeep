"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    FolderKanban,
    ChevronRight,
    MessageSquare,
    ListTodo,
    MoreVertical,
    Pencil,
    Trash2,
    Mail,
    Github,
    ExternalLink
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { useHiddenSpace } from "@/components/providers/HiddenSpaceProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ProjectForm } from "./ProjectForm";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ProjectCardProps {
    project: any;
    onDelete?: (id: string) => void;
    currentUserId?: string;
}

export function ProjectCard({ project, onDelete, currentUserId }: ProjectCardProps) {
    const { counts } = useNotifications();
    const { isHiddenMode } = useHiddenSpace();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const projectUnread = counts.projects[project._id] || { messages: 0, tasks: 0 };
    const ownerId = typeof project.userId === 'string' ? project.userId : project.userId?._id;
    const isOwner = currentUserId === ownerId;
    const ownerEmail = typeof project.userId === 'object' ? project.userId?.email : null;

    return (
        <Card className={cn(
            "group relative overflow-hidden transition-all duration-300",
            isHiddenMode
                ? "bg-black/40 border-purple-500/20 hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]"
                : "hover:bg-secondary/20 border-white/10"
        )}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                <div className="flex items-center gap-4">
                    <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors">
                        {project.logo ? (
                            <Image src={project.logo} alt={project.name} fill className="object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-secondary/50">
                                <FolderKanban className="h-5 w-5 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold group-hover:text-white transition-colors">
                            {project.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] font-medium border-white/10 text-muted-foreground">
                                {project.environment}
                            </Badge>
                            <Badge variant="outline" className={cn(
                                "text-[10px] font-medium border-transparent",
                                project.status === "Active" ? "bg-green-500/10 text-green-500" : "bg-secondary text-muted-foreground"
                            )}>
                                {project.status}
                            </Badge>
                            {!isOwner && (
                                <Badge variant="secondary" className="text-[10px] font-medium">
                                    Collaborator
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                            {projectUnread.messages > 0 && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                                    <MessageSquare className="h-3 w-3" />
                                    {projectUnread.messages}
                                </div>
                            )}
                            {projectUnread.tasks > 0 && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                                    <ListTodo className="h-3 w-3" />
                                    {projectUnread.tasks}
                                </div>
                            )}
                        </div>
                        {!isOwner && ownerEmail && (
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground font-medium">
                                <Mail className="h-3 w-3" />
                                Owner: {ownerEmail}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {project.repositoryUrl && (
                        <Link href={project.repositoryUrl} target="_blank">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                                <Github className="h-4 w-4" />
                            </Button>
                        </Link>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setIsEditDialogOpen(true)}>
                                <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            {isOwner && (
                                <DropdownMenuItem
                                    className="text-destructive gap-2 cursor-pointer"
                                    onClick={() => setShowDeleteModal(true)}
                                >
                                    <Trash2 className="h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <ConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={() => {
                        onDelete?.(project._id);
                        setShowDeleteModal(false);
                    }}
                    title="Delete Project?"
                    description={`This will permanently remove ${project.name} and all its associated documentation, tasks, and credentials. This action cannot be undone.`}
                    confirmText="Delete Project"
                    variant="destructive"
                />

                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>Edit Project Info</DialogTitle>
                            <DialogDescription>
                                Update the core details and status of this project.
                            </DialogDescription>
                        </DialogHeader>
                        <ProjectForm
                            initialData={project}
                            onSuccess={() => setIsEditDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </CardHeader>

            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {project.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                    {project.techStack.map((tech: string) => (
                        <Badge key={tech} variant="secondary" className="text-[10px] font-medium text-muted-foreground">
                            {tech}
                        </Badge>
                    ))}
                </div>

                <div className="pt-2 flex items-center gap-3">
                    <Link href={`/projects/${project._id}`} className="flex-1">
                        <Button className="w-full text-xs font-medium h-9">
                            Enter Workspace
                        </Button>
                    </Link>
                    {project.liveUrl && (
                        <Link href={project.liveUrl} target="_blank">
                            <Button variant="outline" size="icon" className="h-9 w-9">
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </Link>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
