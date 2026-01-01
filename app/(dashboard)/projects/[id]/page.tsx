"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChevronLeft,
    Github,
    ExternalLink,
    Lock,
    Terminal,
    FileText,
    Plus,
    Settings,
    Globe,
    Code2,
    Calendar,
    Users,
    MessageSquare,
    LayoutList,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CredentialForm } from "@/components/credentials/CredentialForm";
import { CommandForm } from "@/components/commands/CommandForm";
import { CredentialCard } from "@/components/credentials/CredentialCard";
import { CommandCard } from "@/components/commands/CommandCard";
import { CollaboratorModal } from "@/components/projects/CollaboratorModal";
import Image from "next/image";

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { data: session } = useSession();
    const [project, setProject] = useState<any>(null);
    const [credentials, setCredentials] = useState<any[]>([]);
    const [commands, setCommands] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("credentials");
    const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<any>(null);

    const fetchData = async () => {
        try {
            const [projectRes, credsRes, commandsRes, notesRes] = await Promise.all([
                fetch(`/api/projects/${params.id}`),
                fetch(`/api/credentials?projectId=${params.id}`),
                fetch(`/api/commands?projectId=${params.id}`),
                fetch(`/api/notes?projectId=${params.id}`),
            ]);

            if (!projectRes.ok) throw new Error("Failed to fetch project");

            const [projectData, credsData, commandsData, notesData] = await Promise.all([
                projectRes.json(),
                credsRes.json(),
                commandsRes.json(),
                notesRes.json(),
            ]);

            setProject(projectData.project || projectData);
            setCredentials(credsData.credentials || []);
            setCommands(commandsData.commands || []);
            setNotes(notesData.notes || []);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load project details or resources.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) fetchData();
    }, [params.id]);

    const handleSuccess = () => {
        setIsResourceDialogOpen(false);
        setSelectedResource(null);
        fetchData();
    };

    const handleDeleteResource = async (type: string, id: string) => {
        if (!confirm(`Permanently remove this ${type}?`)) return;

        try {
            const res = await fetch(`/api/${type}s/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Deletion failed");

            toast({ title: "Success", description: `${type} purged from workspace.` });
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: `Failed to delete ${type}.` });
        }
    };

    if (loading) return (
        <div className="p-8 space-y-8 animate-pulse">
            <div className="h-4 w-24 bg-white/5 rounded" />
            <div className="flex gap-6">
                <div className="h-20 w-20 bg-white/5 rounded-2xl" />
                <div className="space-y-2 flex-1">
                    <div className="h-8 w-64 bg-white/5 rounded" />
                    <div className="h-4 w-48 bg-white/5 rounded" />
                </div>
            </div>
            <div className="h-12 w-full bg-white/5 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-64 bg-white/5 rounded-xl" />
                <div className="h-64 bg-white/5 rounded-xl" />
                <div className="h-64 bg-white/5 rounded-xl" />
            </div>
        </div>
    );

    if (!project) return null;

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="space-y-6">
                <Link
                    href="/projects"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Projects
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="relative h-20 w-20 rounded-2xl overflow-hidden border border-white/10 bg-secondary/20">
                            {project.logo ? (
                                <Image src={project.logo} alt={project.name} fill className="object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <Code2 className="h-8 w-8 text-primary" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight text-white">{project.name}</h1>
                                <Badge variant="outline" className={project.status === 'Active' ? 'text-green-500 border-green-500/20 bg-green-500/10' : ''}>
                                    {project.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-muted-foreground">
                                <span className="text-xs font-medium flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5" />
                                    {project.environment} Environment
                                </span>
                                <span className="text-xs font-medium flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Created {new Date(project.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {project.repositoryUrl && (
                            <Link href={project.repositoryUrl} target="_blank">
                                <Button variant="outline" className="h-10 gap-2">
                                    <Github className="h-4 w-4" />
                                    Repo
                                </Button>
                            </Link>
                        )}
                        {project.liveUrl && (
                            <Link href={project.liveUrl} target="_blank">
                                <Button variant="outline" className="h-10 gap-2">
                                    <ExternalLink className="h-4 w-4" />
                                    Live
                                </Button>
                            </Link>
                        )}
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                            <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                            onClick={() => setIsShareModalOpen(true)}
                            className="h-10 gap-2"
                        >
                            <Users className="h-4 w-4" />
                            Share
                        </Button>
                    </div>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Credentials</CardTitle>
                        <Lock className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{credentials.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Secured items</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Commands</CardTitle>
                        <Terminal className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{commands.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Snippets stored</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
                        <FileText className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{notes.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Docs created</p>
                    </CardContent>
                </Card>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="credentials" className="w-full" onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-6">
                    <TabsList>
                        <TabsTrigger value="credentials" className="gap-2">
                            <Lock className="h-3.5 w-3.5" />
                            Credentials
                        </TabsTrigger>
                        <TabsTrigger value="commands" className="gap-2">
                            <Terminal className="h-3.5 w-3.5" />
                            Commands
                        </TabsTrigger>
                        <TabsTrigger value="notes" className="gap-2">
                            <FileText className="h-3.5 w-3.5" />
                            Notes
                        </TabsTrigger>
                        <TabsTrigger value="tasks" className="gap-2">
                            <LayoutList className="h-3.5 w-3.5" />
                            Tasks
                        </TabsTrigger>
                        <TabsTrigger value="chat" className="gap-2">
                            <Users className="h-3.5 w-3.5" />
                            Discussion
                        </TabsTrigger>
                    </TabsList>

                    <Dialog open={isResourceDialogOpen} onOpenChange={(open) => {
                        setIsResourceDialogOpen(open);
                        if (!open) setSelectedResource(null);
                    }}>
                        <Button
                            size="sm"
                            className="h-9 gap-2"
                            onClick={() => {
                                if (activeTab === 'notes') {
                                    router.push(`/notes/new?projectId=${params.id}`);
                                } else {
                                    setIsResourceDialogOpen(true);
                                }
                            }}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Item
                        </Button>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {selectedResource ? "Edit" : "New"} {activeTab === 'credentials' ? 'Credential' : activeTab === 'commands' ? 'Command' : 'Item'}
                                </DialogTitle>
                                <DialogDescription>
                                    {activeTab === 'credentials' && "Securely store a new credential for this project."}
                                    {activeTab === 'commands' && "Save a useful command snippet for this project."}
                                </DialogDescription>
                            </DialogHeader>
                            {activeTab === 'credentials' && (
                                <CredentialForm
                                    initialData={selectedResource || { projectId: params.id }}
                                    projects={[project]}
                                    onSuccess={handleSuccess}
                                />
                            )}
                            {activeTab === 'commands' && (
                                <CommandForm
                                    initialData={selectedResource || { projectId: params.id }}
                                    projects={[project]}
                                    onSuccess={handleSuccess}
                                />
                            )}
                        </DialogContent>
                    </Dialog>
                </div>

                <TabsContent value="credentials" className="mt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {credentials.length > 0 ? (
                            credentials.map((cred) => (
                                <CredentialCard
                                    key={cred._id}
                                    credential={cred}
                                    onDelete={(id) => handleDeleteResource('credential', id)}
                                    onEdit={(c) => {
                                        setSelectedResource(c);
                                        setIsResourceDialogOpen(true);
                                    }}
                                />
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 custom-dashed rounded-xl bg-secondary/5 text-center">
                                <Lock className="h-10 w-10 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium text-white">No Credentials</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                                    Store API keys, database URLs, and other secrets securely.
                                </p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="commands" className="mt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {commands.length > 0 ? (
                            commands.map((cmd) => (
                                <CommandCard
                                    key={cmd._id}
                                    command={cmd}
                                    onDelete={(id) => handleDeleteResource('command', id)}
                                    onEdit={(c) => {
                                        setSelectedResource(c);
                                        setIsResourceDialogOpen(true);
                                    }}
                                />
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 custom-dashed rounded-xl bg-secondary/5 text-center">
                                <Terminal className="h-10 w-10 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium text-white">No Commands</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                                    Save frequently used CLI commands and scripts.
                                </p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-0 space-y-4">
                    {/* ... notes content ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {notes.length > 0 ? (
                            notes.map((note) => (
                                <Link key={note._id} href={`/notes/${note._id}`}>
                                    <Card className="h-full hover:border-white/20 transition-colors cursor-pointer group">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge variant="outline" className="text-[10px] h-5 font-medium text-muted-foreground">
                                                    Note
                                                </Badge>
                                                <FileText className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <CardTitle className="text-base font-semibold leading-tight line-clamp-1">
                                                {note.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4 min-h-[40px]">
                                                {note.content.substring(0, 100).replace(/[#*`]/g, "")}...
                                            </p>
                                            <div className="flex items-center justify-between pt-4 border-t border-border/40">
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(note.updatedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 custom-dashed rounded-xl bg-secondary/5 text-center">
                                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium text-white">No Notes</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                                    Create documentation and keep track of project details.
                                </p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="tasks" className="mt-0 h-full">
                    <TaskBoard projectId={project._id} />
                </TabsContent>

                <TabsContent value="chat" className="mt-0">
                    <ChatInterface projectId={project._id} />
                </TabsContent>
            </Tabs>

            <CollaboratorModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                projectId={project._id}
                ownerId={typeof project.userId === 'object' ? project.userId._id : project.userId}
                currentUserId={session?.user?.id || ""}
                collaborators={project.sharedWith || []}
                onUpdate={fetchData}
            />
        </div>
    );
}
