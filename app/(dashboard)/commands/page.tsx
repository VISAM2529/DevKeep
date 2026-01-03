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
    Edit2,
    Trash2,
    Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
import { useHiddenSpace } from "@/components/providers/HiddenSpaceProvider";

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
    const [filterType, setFilterType] = useState("All");
    const { isHiddenMode } = useHiddenSpace();

    const handleView = (command: any) => {
        handleEdit(command);
    };

    const fetchData = async () => {
        try {
            const [commandsRes, projectsRes] = await Promise.all([
                fetch(`/api/commands?hidden=${isHiddenMode}`),
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
    }, [isHiddenMode]);

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
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 min-h-full pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8">
                <div className="space-y-1">
                    <h1 className={cn(
                        "text-2xl md:text-3xl font-bold tracking-tight transition-colors",
                        isHiddenMode ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-200" : "text-white"
                    )}>
                        Code Snippets
                    </h1>
                    <p className={cn(
                        "text-sm md:text-base transition-colors",
                        isHiddenMode ? "text-purple-300/60" : "text-muted-foreground"
                    )}>
                        Store and organize your commonly used commands and code blocks.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setSelectedCommand(null);
                }}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => setIsDialogOpen(true)}
                            className={cn(
                                "md:w-auto w-full transition-all duration-300",
                                isHiddenMode
                                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] border-purple-500/50"
                                    : "bg-white text-black hover:bg-white/90"
                            )}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Snippet
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

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className={cn(
                        "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                        isHiddenMode ? "text-purple-400/50 group-hover:text-purple-400" : "text-muted-foreground"
                    )} />
                    <Input
                        placeholder="Search snippets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                            "pl-9 transition-all duration-300",
                            isHiddenMode
                                ? "bg-black/40 border-purple-500/20 text-purple-100 placeholder:text-purple-500/30 focus:border-purple-500/50 focus:ring-purple-500/20"
                                : "bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-white/20"
                        )}
                    />
                </div>

                <div className={cn(
                    "flex items-center gap-1 p-1 rounded-lg border",
                    isHiddenMode ? "bg-black/40 border-purple-500/20" : "bg-white/5 border-white/10"
                )}>
                    {["All", "Command", "Snippet", "Config"].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setFilterType(filter)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                                filterType === filter
                                    ? isHiddenMode
                                        ? "bg-purple-500/20 text-purple-300 shadow-sm"
                                        : "bg-white/10 text-white"
                                    : isHiddenMode
                                        ? "text-purple-400/50 hover:text-purple-300 hover:bg-purple-500/10"
                                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>
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
                        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                            {filteredCommands.map((cmd) => (
                                <div
                                    key={cmd._id}
                                    onClick={() => handleView(cmd)}
                                    className={cn(
                                        "group relative overflow-hidden rounded-xl border p-4 md:p-6 transition-all duration-300 cursor-pointer backdrop-blur-sm",
                                        isHiddenMode
                                            ? "bg-black/40 border-purple-500/20 hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]"
                                            : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                                    )}
                                >
                                    <div className="flex items-start justify-between mb-4 relative z-10">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className={cn(
                                                "h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center transition-colors",
                                                isHiddenMode
                                                    ? "bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20"
                                                    : "bg-white/5 text-white/80 group-hover:bg-white/10"
                                            )}>
                                                <Terminal className="h-5 w-5 md:h-6 md:w-6" />
                                            </div>
                                            <div>
                                                <h3 className={cn("text-base md:text-lg font-semibold transition-colors", isHiddenMode ? "text-purple-100 group-hover:text-purple-50" : "text-white group-hover:text-primary-foreground")}>{cmd.title}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", isHiddenMode ? "bg-purple-500/10 text-purple-300 border-purple-500/20" : "bg-white/5 text-white/50 border-white/5")}>
                                                        {cmd.type}
                                                    </span>
                                                    {cmd.language && (
                                                        <span className={cn("text-xs", isHiddenMode ? "text-purple-300/60" : "text-muted-foreground")}>{cmd.language}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn("h-7 w-7 md:h-8 md:w-8", isHiddenMode ? "text-purple-300 hover:text-purple-100 hover:bg-purple-500/20" : "text-white/60 hover:text-white hover:bg-white/10")}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(cmd);
                                                }}
                                            >
                                                <Edit2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn("h-7 w-7 md:h-8 md:w-8", isHiddenMode ? "text-purple-300 hover:text-red-400 hover:bg-red-500/10" : "text-white/60 hover:text-red-400 hover:bg-red-500/10")}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(cmd._id);
                                                }}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "relative mt-4 rounded-lg p-3 md:p-4 font-mono text-xs md:text-sm overflow-hidden",
                                        isHiddenMode ? "bg-black/60 border border-purple-500/10 text-purple-100/90" : "bg-black/50 text-white/90"
                                    )}>
                                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn("h-6 w-6", isHiddenMode ? "text-purple-400 hover:bg-purple-500/20" : "text-white/40 hover:text-white")}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(cmd.command);
                                                    toast({ description: "Copied to clipboard" });
                                                }}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <code className="block truncate pr-8">
                                            {cmd.command}
                                        </code>
                                    </div>

                                    {/* Decorative gradient for hidden mode */}
                                    {isHiddenMode && (
                                        <div className="absolute -left-10 -top-10 h-32 w-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-500" />
                                    )}
                                </div>
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

