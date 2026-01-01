"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Lock,
    Eye,
    EyeOff,
    Copy,
    Check,
    Trash2,
    Shield,
    MoreVertical,
    Pencil
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CredentialCardProps {
    credential: {
        _id: string;
        platform: string;
        username: string;
        password?: string;
        notes?: string;
        projectId?: any;
    };
    onDelete?: (id: string) => void;
    onEdit?: (credential: any) => void;
}

export function CredentialCard({ credential, onDelete, onEdit }: CredentialCardProps) {
    const { toast } = useToast();
    const [isRevealed, setIsRevealed] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [decryptedPassword, setDecryptedPassword] = useState<string | null>(null);
    const [isLoadingPassword, setIsLoadingPassword] = useState(false);

    const fetchPassword = async () => {
        if (decryptedPassword) return decryptedPassword;

        setIsLoadingPassword(true);
        try {
            const res = await fetch(`/api/credentials/${credential._id}`);
            if (!res.ok) throw new Error("Failed to fetch password");

            const data = await res.json();
            const password = data.credential.password;
            setDecryptedPassword(password);
            return password;
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to retrieve password.",
            });
            return null;
        } finally {
            setIsLoadingPassword(false);
        }
    };

    const handleToggleReveal = async () => {
        if (isRevealed) {
            setIsRevealed(false);
        } else {
            const password = await fetchPassword();
            if (password) setIsRevealed(true);
        }
    };

    const handleCopy = async () => {
        const password = await fetchPassword();
        if (!password) return;

        try {
            await navigator.clipboard.writeText(password);
            setIsCopied(true);
            toast({
                title: "Secret Captured",
                description: "Password copied to clipboard safely.",
            });
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Copy Failed",
                description: "Failed to access clipboard.",
            });
        }
    };

    return (
        <Card className="group transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center border border-white/5">
                        <Shield className="h-4 w-4 text-white/70" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-semibold text-white">{credential.platform}</CardTitle>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px] mt-0.5">
                            {credential.username}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onEdit?.(credential)}>
                                <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive gap-2 cursor-pointer"
                                onClick={() => onDelete?.(credential._id)}
                            >
                                <Trash2 className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="relative group/key">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-black/20 border border-white/5 transition-all group-hover/key:border-white/10">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground ml-2" />
                        <span className="flex-1 font-mono text-sm text-white/90 truncate">
                            {isLoadingPassword ? (
                                <span className="animate-pulse text-muted-foreground">Decrypting...</span>
                            ) : isRevealed ? (
                                decryptedPassword
                            ) : (
                                "••••••••••••"
                            )}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-white"
                                onClick={handleToggleReveal}
                                disabled={isLoadingPassword}
                            >
                                {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-white"
                                onClick={handleCopy}
                                disabled={isLoadingPassword}
                            >
                                {isCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {credential.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {credential.notes}
                    </p>
                )}

                <div className="flex items-center justify-between pt-1">
                    <Badge variant="outline" className="text-[10px] font-medium border-white/10 text-muted-foreground">
                        {credential.projectId?.name || "Global Entry"}
                    </Badge>
                    <div className="flex items-center gap-1.5 opacity-50">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <span className="text-[10px] font-medium text-muted-foreground">AES-256</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
