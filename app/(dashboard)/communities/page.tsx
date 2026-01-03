"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CommunityCard } from "@/components/communities/CommunityCard";
import { CommunityForm } from "@/components/communities/CommunityForm";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useHiddenSpace } from "@/components/providers/HiddenSpaceProvider";

import { CommunityInvitationCard } from "@/components/communities/CommunityInvitationCard";

export default function CommunitiesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [communities, setCommunities] = useState<any[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const { isHiddenMode } = useHiddenSpace();

    const fetchCommunities = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/communities?hidden=${isHiddenMode}`);
            const data = await res.json();
            if (res.ok) {
                // Handle new structure { communities: [], pendingInvitations: [] }
                // fallback for legacy response which might be array
                if (Array.isArray(data)) {
                    setCommunities(data);
                    setPendingInvitations([]);
                } else {
                    setCommunities(data.communities || []);
                    setPendingInvitations(data.pendingInvitations || []);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCommunities();
    }, [isHiddenMode]);

    const filteredCommunities = communities.filter((community) =>
        community.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        setCommunities(communities.filter((c) => c._id !== id));
    };

    return (
        <div className="h-full flex flex-col p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className={cn(
                        "text-2xl md:text-3xl font-bold tracking-tight",
                        isHiddenMode ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600" : "text-foreground"
                    )}>Communities</h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Connect, collaborate, and chat with your teams.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className={cn(
                            "gap-2 w-full md:w-auto",
                            isHiddenMode && "bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                        )}>
                            <Plus className="h-4 w-4" />
                            New Community
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Community</DialogTitle>
                            <DialogDescription>
                                Establish a new space for your team projects and discussions.
                            </DialogDescription>
                        </DialogHeader>
                        <CommunityForm
                            onSuccess={() => {
                                setIsDialogOpen(false);
                                fetchCommunities();
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative">
                <Search className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
                    isHiddenMode ? "text-purple-400" : "text-muted-foreground"
                )} />
                <Input
                    placeholder="Search communities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn(
                        "pl-10 max-w-md",
                        isHiddenMode
                            ? "bg-black/40 border-purple-500/20 text-purple-100 placeholder:text-purple-500/50 focus-visible:ring-purple-500/50"
                            : "bg-secondary/20"
                    )}
                />
            </div>

            {/* Pending Invitations Section */}
            {pendingInvitations.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold tracking-tight">Pending Invitations</h2>
                        <span className="h-5 px-2 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium border border-blue-500/20">
                            {pendingInvitations.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingInvitations.map((community) => (
                            <CommunityInvitationCard
                                key={community._id}
                                community={community}
                                onUpdate={fetchCommunities}
                            />
                        ))}
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-[200px] rounded-xl bg-card/50 animate-pulse border border-white/5" />
                    ))}
                </div>
            ) : filteredCommunities.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCommunities.map((community) => (
                        <CommunityCard
                            key={community._id}
                            community={community}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="rounded-full bg-muted/30 p-4 mb-4">
                        <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">No communities found</h3>
                    <p className="text-muted-foreground max-w-sm mt-2">
                        Get started by creating a new community for your team.
                    </p>
                </div>
            )}
        </div>
    );
}
