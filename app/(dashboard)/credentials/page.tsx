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

export default function CredentialsPage() {
    const { toast } = useToast();
    const [credentials, setCredentials] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCredential, setSelectedCredential] = useState<any>(null);

    const fetchData = async () => {
        try {
            const [credsRes, projectsRes] = await Promise.all([
                fetch("/api/credentials"),
                fetch("/api/projects")
            ]);

            if (!credsRes.ok || !projectsRes.ok) throw new Error("Synchronization failure");

            const [credsData, projectsData] = await Promise.all([
                credsRes.json(),
                projectsRes.json()
            ]);

            setCredentials(credsData.credentials || []);
            setProjects(projectsData.projects || []);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Sync Error",
                description: "Failed to synchronize with the vault.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
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
        fetchData();
    };

    const filteredCredentials = (credentials || []).filter((c) =>
        (c.platform || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.username || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Identity Vault</h1>
                    <p className="text-muted-foreground max-w-md text-sm">
                        Manage your sensitive environment variables and platform access keys with AES-256 security.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setSelectedCredential(null);
                }}>
                    <DialogTrigger asChild>
                        <Button className="h-10 px-4 gap-2 text-sm font-medium">
                            <Plus className="h-4 w-4" />
                            Provision Secret
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

            {/* Utility Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative group flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search workspace identifiers..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="h-10 px-4 gap-2 text-sm font-medium">
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
                    {filteredCredentials.map((credential) => (
                        <CredentialCard
                            key={credential._id}
                            credential={credential}
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
            )}
        </div>
    );
}
