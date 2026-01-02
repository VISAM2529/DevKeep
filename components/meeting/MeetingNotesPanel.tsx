"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MeetingNotesPanelProps {
    projectId?: string;
    communityId?: string;
    onClose?: () => void;
}

export function MeetingNotesPanel({ projectId, communityId, onClose }: MeetingNotesPanelProps) {
    const { toast } = useToast();
    const [note, setNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!note.trim()) return;

        setIsSaving(true);
        try {
            const res = await fetch("/api/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: `Meeting Notes - ${new Date().toLocaleString()}`,
                    content: note,
                    projectId: projectId,
                    communityId: communityId,
                    isGlobal: false
                }),
            });

            if (!res.ok) throw new Error("Failed to save note");

            toast({
                title: "Note Saved",
                description: "Meeting notes captured successfully.",
            });
            setNote(""); // Clear or keep? Usually clear to allow new notes or keep for ongoing. 
            // Let's clear to indicate save success and allow user to write more points if needed.
            // Or better, keep it so they can append? 
            // For now, let's keep it and show a success state.
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to save meeting notes.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-card border-l border-border/40 shadow-xl w-80 md:w-96">
            <div className="flex items-center justify-between p-4 border-b border-border/40">
                <h3 className="font-semibold text-sm">Meeting Notes</h3>
                {onClose && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="flex-1 p-4 flex flex-col gap-4">
                <p className="text-xs text-muted-foreground">
                    Take quick notes during the call. They will be saved to the project documents.
                </p>
                <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Type your notes here..."
                    className="flex-1 resize-none bg-secondary/20 border-border/40 focus:ring-primary/20 p-4 text-sm leading-relaxed"
                />
            </div>

            <div className="p-4 border-t border-border/40 bg-muted/20">
                <Button
                    onClick={handleSave}
                    disabled={isSaving || !note.trim()}
                    className="w-full gap-2 font-medium"
                >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save to Documents
                </Button>
            </div>
        </div>
    );
}
