"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, X, Users } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CollaboratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    ownerId: string;
    currentUserId: string;
    collaborators: any[];
    onUpdate: () => void;
}

export function CollaboratorModal({
    isOpen,
    onClose,
    projectId,
    ownerId,
    currentUserId,
    collaborators,
    onUpdate,
}: CollaboratorModalProps) {
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"Collaborator" | "Admin" | "Project Lead">("Collaborator");
    const [isLoading, setIsLoading] = useState(false);
    const isOwner = currentUserId === ownerId;

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/share`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.toLowerCase(), role }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to share project");

            toast({
                title: "Invitation Sent",
                description: `Invited ${email.toLowerCase()} as ${role}.`,
            });
            setEmail("");
            setRole("Collaborator");
            onUpdate();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async (targetEmail: string) => {
        try {
            const res = await fetch(
                `/api/projects/${projectId}/share?email=${encodeURIComponent(targetEmail)}`,
                { method: "DELETE" }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to remove collaborator");
            }

            toast({
                title: "Access Revoked",
                description: `Removed ${targetEmail} from workspace.`,
            });
            onUpdate();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Manage Access
                    </DialogTitle>
                    <DialogDescription>
                        Invite team members and manage permissions.
                    </DialogDescription>
                </DialogHeader>

                {isOwner && (
                    <form onSubmit={handleShare} className="space-y-4 py-4 border-b border-border/40">
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Invite User</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="developer@email.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex-1"
                                />
                                <Select value={role} onValueChange={(value: "Collaborator" | "Admin" | "Project Lead") => setRole(value)}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Collaborator">Collaborator</SelectItem>
                                        <SelectItem value="Project Lead">Project Lead</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                type="submit"
                                disabled={isLoading || !email}
                                className="w-full gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <UserPlus className="h-4 w-4" />
                                )}
                                Send Invitation
                            </Button>
                        </div>
                    </form>
                )}

                <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                        Active Members ({collaborators.length})
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {collaborators.length === 0 && (
                            <div className="py-8 text-center text-muted-foreground text-sm">
                                <p>No active collaborators.</p>
                            </div>
                        )}
                        {collaborators.map((collab) => (
                            <div
                                key={collab.email}
                                className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card hover:bg-secondary/20 transition-colors"
                            >
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-medium">
                                        {collab.email}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-xs font-normal">
                                            {collab.role}
                                        </Badge>
                                        {!collab.accepted && (
                                            <Badge variant="outline" className="text-xs font-normal text-yellow-500 border-yellow-500/20 bg-yellow-500/10">
                                                Pending
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                {isOwner && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemove(collab.email)}
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
