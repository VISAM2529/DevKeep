"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Clock, LogIn, LogOut, MoreVertical, Pencil, Trash2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useSession } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CommunityForm } from "./CommunityForm";

interface CommunityCardProps {
    community: {
        _id: string;
        name: string;
        description: string;
        members: any[];
        createdAt: string;
        ownerId: string;
    };
    onDelete?: (id: string) => void;
}

export function CommunityCard({ community, onDelete }: CommunityCardProps) {
    const { toast } = useToast();
    const { data: session } = useSession();
    const { counts } = useNotifications();
    const communityUnread = counts.communities[community._id] || { messages: 0 };

    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [showClockOutModal, setShowClockOutModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const isOwner = session?.user?.id === community.ownerId;

    useEffect(() => {
        checkAttendanceStatus();
    }, [community._id]);

    const checkAttendanceStatus = async () => {
        try {
            const res = await fetch(`/api/communities/${community._id}/attendance/status`);
            if (res.ok) {
                const data = await res.json();
                setIsActive(data.isActive);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleClockAction = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/communities/${community._id}/attendance`, {
                method: "POST",
            });

            if (!res.ok) throw new Error("Failed to process attendance");

            const data = await res.json();

            toast({
                title: data.action === "clockIn" ? "Clocked In" : "Clocked Out",
                description: data.message,
            });

            setIsActive(data.action === "clockIn");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setLoading(false);
            setShowClockOutModal(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/communities/${community._id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete community");
            }

            toast({
                title: "Community Deleted",
                description: "The community and all its data have been removed.",
            });
            onDelete?.(community._id);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
        }
    };

    return (
        <Card className="group relative overflow-hidden transition-all hover:bg-secondary/20 border-border/40 bg-card p-6 rounded-xl flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2.5">
                        <Users className="h-5 w-5 text-primary" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!checkingStatus && (
                        <Badge
                            variant={isActive ? "default" : "secondary"}
                            className="text-xs font-normal gap-1"
                        >
                            <Clock className="h-3 w-3" />
                            {isActive ? "Active" : "Inactive"}
                        </Badge>
                    )}
                    <Badge variant="outline" className="text-xs font-normal">
                        {community.members.length} member{community.members.length !== 1 && "s"}
                    </Badge>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border/40">
                            <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onClick={() => setIsEditDialogOpen(true)}
                            >
                                <Pencil className="h-4 w-4" /> Edit Info
                            </DropdownMenuItem>
                            {isOwner && (
                                <DropdownMenuItem
                                    className="text-destructive gap-2 cursor-pointer focus:bg-destructive/10"
                                    onClick={() => setShowDeleteModal(true)}
                                >
                                    <Trash2 className="h-4 w-4" /> Delete Community
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {community.name}
                    </h3>
                    {communityUnread.messages > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                            <MessageSquare className="h-3 w-3" />
                            {communityUnread.messages}
                        </div>
                    )}
                </div>
                <p className="text-muted-foreground text-sm line-clamp-2">
                    {community.description || "No description provided."}
                </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                    Created {formatDistanceToNow(new Date(community.createdAt))} ago
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        variant={isActive ? "destructive" : "default"}
                        size="sm"
                        className="gap-1.5 h-8 px-3"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            isActive ? setShowClockOutModal(true) : handleClockAction();
                        }}
                        disabled={loading || checkingStatus}
                    >
                        {isActive ? (
                            <>
                                <LogOut className="h-3.5 w-3.5" />
                                Clock Out
                            </>
                        ) : (
                            <>
                                <LogIn className="h-3.5 w-3.5" />
                                Clock In
                            </>
                        )}
                    </Button>
                    <Link href={`/communities/${community._id}`}>
                        <Button variant="ghost" size="sm" className="gap-2 h-8 px-2">
                            Enter
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                </div>
            </div>

            <ConfirmModal
                isOpen={showClockOutModal}
                onClose={() => setShowClockOutModal(false)}
                onConfirm={handleClockAction}
                isLoading={loading}
                title="Finish Session?"
                description={`You are about to clock out from ${community.name}. This will end your current record.`}
                confirmText="Clock Out"
                variant="primary"
            />

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                isLoading={loading}
                title="Dissolve Community?"
                description={`You are about to delete ${community.name}. This is permanent and will remove all messages and attendance records.`}
                confirmText="Delete Community"
                variant="destructive"
            />

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Community Info</DialogTitle>
                        <DialogDescription>
                            Update the name and description of this space.
                        </DialogDescription>
                    </DialogHeader>
                    <CommunityForm
                        initialData={community}
                        onSuccess={() => {
                            setIsEditDialogOpen(false);
                            // We need a way to refresh the parent list
                            // But usually router.refresh() or a local refresh function works
                            window.location.reload(); // Simple fallback if onDelete not provided
                        }}
                    />
                </DialogContent>
            </Dialog>
        </Card>
    );
}
