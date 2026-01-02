"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "destructive" | "primary" | "warning";
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "primary",
    isLoading = false,
}: ConfirmModalProps) {
    const Icon = variant === "destructive" || variant === "warning" ? AlertTriangle : Info;

    const variantStyles = {
        primary: "bg-primary hover:bg-primary/90 text-primary-foreground",
        destructive: "bg-red-500 hover:bg-red-600 text-white",
        warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-border/40 bg-card/95 backdrop-blur-xl">
                <div className={cn(
                    "h-24 flex items-center justify-center relative overflow-hidden",
                    variant === "destructive" ? "bg-red-500/10" : "bg-primary/10"
                )}>
                    {/* Decorative Background Elements */}
                    <div className={cn(
                        "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl",
                        variant === "destructive" ? "bg-red-500/20" : "bg-primary/20"
                    )} />
                    <div className={cn(
                        "absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-3xl",
                        variant === "destructive" ? "bg-red-500/10" : "bg-primary/10"
                    )} />

                    <div className={cn(
                        "relative z-10 h-12 w-12 rounded-2xl flex items-center justify-center border transition-all duration-500",
                        variant === "destructive"
                            ? "bg-red-500/20 border-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                            : "bg-primary/20 border-primary/20 text-primary shadow-[0_0_20px_rgba(var(--primary),0.2)]"
                    )}>
                        <Icon className="h-6 w-6 animate-in zoom-in duration-300" />
                    </div>
                </div>

                <div className="p-6">
                    <DialogHeader className="space-y-2">
                        <DialogTitle className="text-xl font-bold tracking-tight text-center text-foreground">
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-center text-sm text-muted-foreground leading-relaxed px-2">
                            {description}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-8 flex flex-row gap-3 sm:gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 h-11 text-muted-foreground font-medium hover:bg-secondary/50"
                            disabled={isLoading}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={cn(
                                "flex-1 h-11 font-semibold transition-all duration-200 shadow-lg",
                                variantStyles[variant],
                                "active:scale-[0.98]"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                confirmText
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
