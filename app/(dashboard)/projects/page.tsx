"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectTable } from "@/components/projects/ProjectTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FolderKanban, LayoutGrid, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { InvitationCard } from "@/components/projects/InvitationCard";
import { useHiddenSpace } from "@/components/providers/HiddenSpaceProvider";

export default function ProjectsPage() {
    const { toast } = useToast();
    const { data: session } = useSession();
    const { isHiddenMode } = useHiddenSpace();
    const [projects, setProjects] = useState<any[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [view, setView] = useState<"grid" | "table">("grid");

    const fetchProjects = async () => {
        setLoading(true); // Moved setLoading to the start
        try {
            const res = await fetch(`/api/projects?hidden=${isHiddenMode}`); // Added hidden query param
            if (!res.ok) throw new Error("Failed to fetch projects");
            const data: any = await res.json(); // Changed type to any for now, assuming Project[] is correct
            setProjects(data.projects || []); // Original line, keeping it for now based on context
            setPendingInvitations(data.pendingInvitations || []); // Original line, keeping it for now based on context
        } catch (error) {
            console.error(error); // Added console.error
            toast({
                title: "Error",
                description: "Failed to load projects",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [isHiddenMode]); // Added isHiddenMode to dependency array

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete project");

            setProjects(projects.filter((p) => p._id !== id));
            toast({
                title: "Project deleted",
                description: "Workspace has been securely wiped.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete project.",
            });
        }
    };

    const filteredProjects = projects.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.techStack.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                <div className="space-y-1">
                    <h1 className={cn(
                        "text-xl md:text-2xl font-bold tracking-tight",
                        isHiddenMode ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600" : "text-white"
                    )}>Projects</h1>
                    <p className="text-muted-foreground max-w-md text-xs md:text-sm">
                        Manage your active development environments and secure their access protocols.
                    </p>
                </div>
                <Link href="/projects/new" className="w-full md:w-auto">
                    <Button className={cn(
                        "w-full h-10 px-4 gap-2 text-sm font-medium",
                        isHiddenMode && "bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                    )}>
                        <Plus className="h-4 w-4" />
                        Initialize Workspace
                    </Button>
                </Link>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4">
                <div className="relative group flex-1 max-w-md">
                    <Search className={cn(
                        "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
                        isHiddenMode ? "text-purple-400" : "text-muted-foreground"
                    )} />
                    <Input
                        placeholder="Search by name or tech stack..."
                        className={cn(
                            "pl-10",
                            isHiddenMode
                                ? "bg-black/40 border-purple-500/20 text-purple-100 placeholder:text-purple-500/50 focus-visible:ring-purple-500/50"
                                : "bg-secondary/20 border-white/5"
                        )}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={cn(
                    "flex items-center rounded-lg p-1 border",
                    isHiddenMode ? "bg-black/40 border-purple-500/20" : "bg-secondary/20 border-white/5"
                )}>
                    <Button
                        variant={view === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        className={cn(
                            "h-8 w-8 rounded-md",
                            view === "grid" && isHiddenMode && "bg-purple-500/20 text-purple-200"
                        )}
                        onClick={() => setView("grid")}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={view === "table" ? "secondary" : "ghost"}
                        size="icon"
                        className={cn(
                            "h-8 w-8 rounded-md",
                            view === "table" && isHiddenMode && "bg-purple-500/20 text-purple-200"
                        )}
                        onClick={() => setView("table")}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Pending Invitations Section */}
            {pendingInvitations.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold tracking-tight">Pending Invitations</h2>
                        <span className="h-5 px-2 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium border border-yellow-500/20">
                            {pendingInvitations.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingInvitations.map((project) => (
                            <InvitationCard
                                key={project._id}
                                project={project}
                                onUpdate={fetchProjects}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Projects Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-[280px] rounded-xl bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : filteredProjects.length > 0 ? (
                view === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <ProjectCard
                                key={project._id}
                                project={project}
                                onDelete={handleDelete}
                                currentUserId={session?.user?.id}
                            />
                        ))}
                    </div>
                ) : (
                    <ProjectTable
                        projects={filteredProjects}
                        onDelete={handleDelete}
                        currentUserId={session?.user?.id}
                    />
                )
            ) : (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                    <div className="h-16 w-16 rounded-xl bg-white/5 flex items-center justify-center mb-6">
                        <FolderKanban className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-white">No Workspaces Detected</h3>
                    <p className="text-muted-foreground mt-1 mb-6 text-center max-w-xs text-sm">
                        Your grid is currently empty. Initialize a new project to start managing your secrets and snippets.
                    </p>
                    <Link href="/projects/new">
                        <Button variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Your First Project
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
