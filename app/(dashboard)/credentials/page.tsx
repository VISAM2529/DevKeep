"use client";

import { useEffect, useState } from "react";
import { CredentialCard } from "@/components/credentials/CredentialCard";
import { CredentialForm } from "@/components/credentials/CredentialForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Lock,
    ShieldCheck,
    Filter,
    ChevronDown
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
import { useHiddenSpace } from "@/components/providers/HiddenSpaceProvider";
import { cn } from "@/lib/utils";

export default function CredentialsPage() {
    const { toast } = useToast();
    const [credentials, setCredentials] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { isHiddenMode } = useHiddenSpace();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCredential, setSelectedCredential] = useState<any>(null);

    const fetchCredentials = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/credentials?hidden=${isHiddenMode}`);
            if (res.ok) {
                const data = await res.json();
                setCredentials(data.credentials);
            } else {
                throw new Error("Failed to fetch credentials");
            }
        } catch (error) {
            console.error("Failed to fetch credentials:", error);
            toast({
                variant: "destructive",
                title: "Sync Error",
                description: "Failed to synchronize credentials.",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await fetch("/api/projects");
            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects || []);
            } else {
                throw new Error("Failed to fetch projects");
            }
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        }
    };

    useEffect(() => {
        fetchCredentials();
    }, [isHiddenMode]);

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this access key? This action is irreversible.")) return;

        try {
            const res = await fetch(`/api/credentials/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Deletion failed");

            setCredentials(credentials.filter((c) => c._id !== id));
            toast({
                title: "Secret Purged",
                description: "Access key has been wiped from the database.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to purge secret.",
            });
        }
    };

    const handleEdit = (credential: any) => {
        setSelectedCredential(credential);
        setIsDialogOpen(true);
    };

    const handleSuccess = () => {
        setIsDialogOpen(false);
        setSelectedCredential(null);
        fetchCredentials();
    };

    const filteredCredentials = (credentials || []).filter((c) =>
        (c.platform || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.username || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 min-h-full pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8">
                <div className="space-y-1">
                    <h1 className={cn(
                        "text-2xl md:text-3xl font-bold tracking-tight transition-colors",
                        isHiddenMode ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-200" : "text-white"
                    )}>
                        Identity Vault
                    </h1>
                    <p className={cn(
                        "text-sm md:text-base transition-colors",
                        isHiddenMode ? "text-purple-300/60" : "text-muted-foreground"
                    )}>
                        Manage your encrypted credentials and secrets securely.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setSelectedCredential(null);
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
                            New Credential
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">
                                {selectedCredential ? "Reconfigure Access" : "Provision New Secret"}
                            </DialogTitle>
                            <DialogDescription>
                                This data will be encrypted before storage.
                            </DialogDescription>
                        </DialogHeader>
                        <CredentialForm
                            initialData={selectedCredential}
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
                        placeholder="Search credentials..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="h-10 px-4 gap-2 text-sm font-medium w-full md:w-auto">
                    <Filter className="h-4 w-4" />
                    Filters
                    <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
            </div>

            {/* Vault Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-40 rounded-xl bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : filteredCredentials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCredentials.map((cred) => (
                        <CredentialCard
                            key={cred._id}
                            credential={cred}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                        />
                    ))}
                </div>

            ) : (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                    <div className="h-16 w-16 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">Vault is Empty</h3>
                    <p className="text-muted-foreground mt-1 mb-6 text-center max-w-xs text-sm">
                        No encrypted access keys found. Provision your first secret to secure your workspace.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(true)}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Provision First Secret
                    </Button>
                </div>
            )
            }
        </div >
    );
}
