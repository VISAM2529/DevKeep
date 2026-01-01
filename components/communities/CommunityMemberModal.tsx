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
import { Loader2, UserPlus, X, Users, Shield } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CommunityMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    ownerId: string;
    currentUserId: string;
    members: any[];
    onUpdate: () => void;
}

export function CommunityMemberModal({
    isOpen,
    onClose,
    communityId,
    ownerId,
    currentUserId,
    members,
    onUpdate,
}: CommunityMemberModalProps) {
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"member" | "admin">("member");
    const [isLoading, setIsLoading] = useState(false);

    // Determines if current user can add/remove members (must be owner or admin)
    // Note: members array items have `userId` populated with {_id, name...} or just ID?
    // Based on page usage, it seems `userId` IS populated object in the `members` prop passed from page.
    const currentUserMember = members.find(m => m.userId._id === currentUserId || m.userId === currentUserId);
    const isAdmin = currentUserMember?.role === 'admin' || currentUserId === ownerId;

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/communities/${communityId}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.toLowerCase(), role }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to add member");

            toast({
                title: "Member Added",
                description: `Added ${email.toLowerCase()} as ${role}.`,
            });
            setEmail("");
            setRole("member");
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

    const handleRemove = async (memberId: string) => {
        try {
            const res = await fetch(
                `/api/communities/${communityId}/members?memberId=${memberId}`,
                { method: "DELETE" }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to remove member");
            }

            toast({
                title: "Removed",
                description: "Member removed from community.",
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
                        Manage Members
                    </DialogTitle>
                    <DialogDescription>
                        Add members to this community and manage roles.
                    </DialogDescription>
                </DialogHeader>

                {isAdmin && (
                    <form onSubmit={handleAddMember} className="space-y-4 py-4 border-b border-border/40">
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Add Member</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="user@email.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex-1"
                                />
                                <Select value={role} onValueChange={(value: "member" | "admin") => setRole(value)}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="member">Member</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
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
                                Add to Community
                            </Button>
                        </div>
                    </form>
                )}

                <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                        Community Members ({members.length})
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {members.map((member) => {
                            // Handle populate differences safely
                            const u = member.userId || {};
                            const memberName = u.name || "Unknown";
                            const memberEmail = u.email || "";
                            const memberId = u._id || member.userId;
                            // If owner, show distinct
                            const isMemberOwner = memberId === ownerId;

                            return (
                                <div
                                    key={memberId}
                                    className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card hover:bg-secondary/20 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border border-border/40">
                                            <AvatarImage src={u.image} />
                                            <AvatarFallback className="text-[10px]">
                                                {getInitials(memberName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium flex items-center gap-2">
                                                {memberName}
                                                {member.role === 'admin' && <Shield className="h-3 w-3 text-primary" />}
                                                {isMemberOwner && <Badge variant="outline" className="text-[10px] h-4 px-1">Owner</Badge>}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">{memberEmail}</span>
                                        </div>
                                    </div>

                                    {isAdmin && !isMemberOwner && memberId !== currentUserId && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemove(memberId)}
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
