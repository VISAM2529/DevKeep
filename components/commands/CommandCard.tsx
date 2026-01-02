"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Terminal,
    Copy,
    Check,
    Trash2,
    Pencil,
    MoreVertical,
    Hash
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface CommandCardProps {
    command: {
        _id: string;
        title: string;
        command: string;
        description?: string;
        category: string;
        tags: string[];
        projectId?: any;
    };
    onDelete?: (id: string) => void;
    onEdit?: (command: any) => void;
}

export function CommandCard({ command, onDelete, onEdit }: CommandCardProps) {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(command.command);
            setIsCopied(true);
            toast({
                title: "Buffer Captured",
                description: "Command copied to clipboard.",
            });
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to access clipboard.",
            });
        }
    };

    return (
        <Card className="group transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center border border-white/5">
                        <Terminal className="h-4 w-4 text-white/70" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-semibold text-white">{command.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px] font-medium border-white/10 text-muted-foreground">
                                {command.category}
                            </Badge>
                            {command.projectId && (
                                <Badge variant="secondary" className="text-[10px] font-medium">
                                    {command.projectId.name}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-white"
                        onClick={handleCopy}
                    >
                        {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onEdit?.(command)}>
                                <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive gap-2 cursor-pointer"
                                onClick={() => setShowDeleteModal(true)}
                            >
                                <Trash2 className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <ConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={() => {
                        onDelete?.(command._id);
                        setShowDeleteModal(false);
                    }}
                    title="Remove Command?"
                    description={`You are about to delete the command "${command.title}". This will permanently remove this utility script from your collection.`}
                    confirmText="Delete Command"
                    variant="destructive"
                />
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="relative group/code">
                    <div className="rounded-lg overflow-hidden border border-white/5 bg-black/20">
                        <SyntaxHighlighter
                            language="bash"
                            style={atomDark}
                            customStyle={{
                                background: "transparent",
                                padding: "1rem",
                                fontSize: "0.8rem",
                                margin: 0,
                            }}
                        >
                            {command.command}
                        </SyntaxHighlighter>
                    </div>
                </div>

                {command.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {command.tags.map((tag) => (
                            <div key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/50 border border-white/5 text-[10px] text-muted-foreground font-medium">
                                <Hash className="h-2.5 w-2.5 opacity-50" />
                                {tag}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
