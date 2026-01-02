"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MoreVertical, ExternalLink, Settings, Trash2, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

interface ProjectTableProps {
    projects: any[];
    onDelete?: (id: string) => void;
    currentUserId?: string;
}

export function ProjectTable({ projects, onDelete, currentUserId }: ProjectTableProps) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="hover:bg-transparent border-white/10">
                        <TableHead className="w-[300px]">Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Tech Stack</TableHead>
                        <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.map((project) => (
                        <TableRow key={project._id} className="hover:bg-white/5 border-white/10">
                            <TableCell className="font-medium">
                                <Link href={`/projects/${project._id}`} className="flex items-center gap-3 group">
                                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                        <FolderKanban className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                            {project.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                            {project.description || "No description"}
                                        </div>
                                    </div>
                                </Link>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Badge variant={project.status === "Active" ? "default" : "secondary"} className="h-5 text-[10px]">
                                        {project.status}
                                    </Badge>
                                    {project.isMeetingActive && (
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                <div className="flex flex-wrap gap-1">
                                    {project.techStack.slice(0, 3).map((tech: string, i: number) => (
                                        <Badge key={i} variant="outline" className="text-[10px] h-5 bg-white/5 border-white/10">
                                            {tech}
                                        </Badge>
                                    ))}
                                    {project.techStack.length > 3 && (
                                        <Badge variant="outline" className="text-[10px] h-5 bg-white/5 border-white/10">
                                            +{project.techStack.length - 3}
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                                {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-[#1A1F2B] border-white/10">
                                        <Link href={`/projects/${project._id}`}>
                                            <DropdownMenuItem className="cursor-pointer">
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Open Project
                                            </DropdownMenuItem>
                                        </Link>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <Settings className="h-4 w-4 mr-2" />
                                            Settings
                                        </DropdownMenuItem>
                                        {onDelete && (currentUserId === project.userId || currentUserId === project.userId._id) && (
                                            <DropdownMenuItem
                                                className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-900/20"
                                                onClick={() => onDelete(project._id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
