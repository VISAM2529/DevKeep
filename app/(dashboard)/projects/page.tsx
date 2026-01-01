"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FolderKanban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { InvitationCard } from "@/components/projects/InvitationCard";

export default function ProjectsPage() {
    const { toast } = useToast();
    const { data: session } = useSession();
    const [projects, setProjects] = useState<any[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchProjects = async () => {
        try {
            const res = await fetch("/api/projects");
            if (!res.ok) throw new Error("Failed to fetch projects");
            const data = await res.json();
            setProjects(data.projects || []);
            setPendingInvitations(data.pendingInvitations || []);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load projects. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will delete all associated credentials, commands, and notes.")) {
            return;
        }

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
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">Projects</h1>
                    <p className="text-muted-foreground max-w-md text-xs md:text-sm">
                        Manage your active development environments and secure their access protocols.
                    </p>
                </div>
                <Link href="/projects/new" className="w-full md:w-auto">
                    <Button className="w-full h-10 px-4 gap-2 text-sm font-medium">
                        <Plus className="h-4 w-4" />
                        Initialize Workspace
                    </Button>
                </Link>
            </div>

            {/* Search and Filters */}
            <div className="relative group max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name or tech stack..."
                    className="pl-10 bg-secondary/20 border-white/5"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
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
