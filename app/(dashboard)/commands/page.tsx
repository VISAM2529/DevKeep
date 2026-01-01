"use client";

import { useEffect, useState } from "react";
import { CommandCard } from "@/components/commands/CommandCard";
import { CommandForm } from "@/components/commands/CommandForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Terminal,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categories = ["All", "VSCode", "Git", "Docker", "NPM", "Server", "Other"];

export default function CommandsPage() {
    const { toast } = useToast();
    const [commands, setCommands] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCommand, setSelectedCommand] = useState<any>(null);
    const [activeCategory, setActiveCategory] = useState("All");

    const fetchData = async () => {
        try {
            const [commandsRes, projectsRes] = await Promise.all([
                fetch("/api/commands"),
                fetch("/api/projects")
            ]);

            if (!commandsRes.ok || !projectsRes.ok) throw new Error("Sync failure");

            const [commandsData, projectsData] = await Promise.all([
                commandsRes.json(),
                projectsRes.json()
            ]);

            setCommands(commandsData.commands || []);
            setProjects(projectsData.projects || []);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load command library.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Wipe this snippet from history?")) return;

        try {
            const res = await fetch(`/api/commands/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Deletion failed");

            setCommands(commands.filter((c) => c._id !== id));
            toast({
                title: "Snippet Purged",
                description: "Entry removed from local database.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to purge snippet.",
            });
        }
    };

    const handleEdit = (command: any) => {
        setSelectedCommand(command);
        setIsDialogOpen(true);
    };

    const handleSuccess = () => {
        setIsDialogOpen(false);
        setSelectedCommand(null);
        fetchData();
    };

    const filteredCommands = (commands || []).filter((c) => {
        const matchesSearch =
            (c.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.command || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.tags || []).some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = activeCategory === "All" || c.category === activeCategory;

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">Snippets</h1>
                    <p className="text-muted-foreground max-w-md text-xs md:text-sm">
                        Store and deploy your most frequent terminal logic and shell scripts.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setSelectedCommand(null);
                }}>
                    <DialogTrigger asChild>
                        <Button className="w-full md:w-auto h-10 px-4 gap-2 text-sm font-medium">
                            <Plus className="h-4 w-4" />
                            Initialize Snippet
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedCommand ? "Recode Snippet" : "Store New Snippet"}
                            </DialogTitle>
                            <DialogDescription>
                                This snippet will be accessible via global search or project scope.
                            </DialogDescription>
                        </DialogHeader>
                        <CommandForm
                            initialData={selectedCommand}
                            projects={projects}
                            onSuccess={handleSuccess}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Utility Bar */}
            <Tabs defaultValue="All" className="w-full" onValueChange={setActiveCategory}>
                <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                    <TabsList className="h-auto p-1 flex-wrap justify-start">
                        {categories.map((cat) => (
                            <TabsTrigger
                                key={cat}
                                value={cat}
                                className="px-3 h-8 text-xs"
                            >
                                {cat}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="relative group max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Filter snippets..."
                            className="pl-9 h-10 bg-secondary/20 border-white/5"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-8">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-56 rounded-xl bg-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : filteredCommands.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCommands.map((command) => (
                                <CommandCard
                                    key={command._id}
                                    command={command}
                                    onDelete={handleDelete}
                                    onEdit={handleEdit}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                            <div className="h-16 w-16 rounded-xl bg-white/5 flex items-center justify-center mb-6">
                                <Terminal className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium text-white">Command Buffer Empty</h3>
                            <p className="text-muted-foreground mt-1 mb-6 text-center max-w-xs text-sm">
                                No snippets found in this category. Commit your first logic block to start your library.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setIsDialogOpen(true)}
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Store First Snippet
                            </Button>
                        </div>
                    )}
                </div>
            </Tabs>
        </div>
    );
}
