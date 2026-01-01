"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CommunityCard } from "@/components/communities/CommunityCard";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const communitySchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

type CommunityFormValues = z.infer<typeof communitySchema>;

export default function CommunitiesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [communities, setCommunities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<CommunityFormValues>({
        resolver: zodResolver(communitySchema),
    });

    const fetchCommunities = async () => {
        try {
            const res = await fetch("/api/communities");
            const data = await res.json();
            if (res.ok) {
                setCommunities(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCommunities();
    }, []);

    const onSubmit = async (data: CommunityFormValues) => {
        try {
            const res = await fetch("/api/communities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Failed to create community");

            toast({
                title: "Community Created",
                description: "Your new community has been established.",
            });
            setIsDialogOpen(false);
            fetchCommunities();
            form.reset();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create community.",
                variant: "destructive",
            });
        }
    };

    const filteredCommunities = communities.filter((community) =>
        community.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col p-8 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Communities</h1>
                    <p className="text-muted-foreground mt-1">
                        Connect, collaborate, and chat with your teams.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
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
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Frontend Team"
                                    {...form.register("name")}
                                />
                                {form.formState.errors.name && (
                                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="What is this community all about?"
                                    {...form.register("description")}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? "Creating..." : "Create Community"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search communities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 max-w-md bg-secondary/20"
                />
            </div>

            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-[200px] rounded-xl bg-card/50 animate-pulse border border-white/5" />
                    ))}
                </div>
            ) : filteredCommunities.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCommunities.map((community) => (
                        <CommunityCard key={community._id} community={community} />
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
