"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    FolderKanban,
    Github,
    ExternalLink,
    MoreVertical,
    Trash2,
    Pencil,
    Mail
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
    project: {
        _id: string;
        name: string;
        description: string;
        techStack: string[];
        logo?: string;
        repositoryUrl?: string;
        liveUrl?: string;
        status: string;
        environment: string;
        userId: string | { _id: string; email: string; name: string };
    };
    onDelete?: (id: string) => void;
    currentUserId?: string;
}

export function ProjectCard({ project, onDelete, currentUserId }: ProjectCardProps) {
    const ownerId = typeof project.userId === 'string' ? project.userId : project.userId._id;
    const isOwner = currentUserId === ownerId;
    const ownerEmail = typeof project.userId === 'object' ? project.userId.email : null;

    return (
        <Card className="group relative overflow-hidden transition-all duration-300">
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
                            <Link href={`/projects/${project._id}`}>
                                <DropdownMenuItem className="gap-2 cursor-pointer">
                                    <Pencil className="h-4 w-4" /> Edit
                                </DropdownMenuItem>
                            </Link>
                            {isOwner && (
                                <DropdownMenuItem
                                    className="text-destructive gap-2 cursor-pointer"
                                    onClick={() => onDelete?.(project._id)}
                                >
                                    <Trash2 className="h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {project.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                    {project.techStack.map((tech) => (
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
