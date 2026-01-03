"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Plus,
    Search,
    FileText,
    ChevronRight,
    Calendar,
    LayoutGrid,
    List,
    Trash2,
    Loader2,
    Paperclip,
    Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useHiddenSpace } from "@/components/providers/HiddenSpaceProvider";

export default function NotesPage() {
    const { toast } = useToast();
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [noteToDelete, setNoteToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { isHiddenMode } = useHiddenSpace();

    const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) throw new Error("Upload failed");
            const { url } = await uploadRes.json();

            // Create a note from the document
            const noteRes = await fetch("/api/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: file.name.split('.')[0], // Use filename as title
                    content: `Document note imported from: **${file.name}**`,
                    attachments: [url],
                    isGlobal: true,
                    isHidden: isHiddenMode
                }),
            });

            if (!noteRes.ok) throw new Error("Failed to create note");

            toast({
                title: "Document Imported",
                description: `Successfully created note from ${file.name}.`,
            });
            fetchNotes(); // Refresh list
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Import Error",
                description: error.message,
            });
        } finally {
            setUploading(false);
        }
    };

    const fetchNotes = async () => {
        try {
            const res = await fetch(`/api/notes?hidden=${isHiddenMode}`);
            if (!res.ok) throw new Error("Synchronization failure");
            const data = await res.json();
            setNotes(data.notes || []);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load documentation library.",
            });
        } finally {
            setLoading(false);
        }
    };

    const deleteNote = async (id: string) => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/notes/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete note");

            toast({
                title: "Note Deleted",
                description: "The note has been successfully removed.",
            });
            fetchNotes();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setIsDeleting(false);
            setNoteToDelete(null);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [isHiddenMode]);

    const filteredNotes = (notes || []).filter((n) =>
        (n.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.content || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">Documentation</h1>
                    <h1 className={cn(
                        "text-2xl md:text-3xl font-bold tracking-tight transition-colors",
                        isHiddenMode ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-200" : "text-white"
                    )}>
                        Documentation
                    </h1>
                    <p className={cn(
                        "text-sm md:text-base transition-colors",
                        isHiddenMode ? "text-purple-300/60" : "text-muted-foreground"
                    )}>
                        Create and manage project documentation and notes.
                    </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <label htmlFor="quick-upload-input" className={cn(
                        "flex-1 md:flex-none transition-all duration-300 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2",
                        isHiddenMode
                            ? "bg-black/40 text-purple-300 border border-purple-500/30 hover:bg-purple-500/10"
                            : "bg-white/10 text-white hover:bg-white/20"
                    )}>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        Quick Upload
                        <input
                            id="quick-upload-input"
                            type="file"
                            className="sr-only"
                            onChange={handleQuickUpload}
                            accept=".doc,.docx,.xls,.xlsx,.pdf"
                            disabled={uploading}
                        />
                    </label>
                    <Link href="/notes/new" className="flex-1 md:flex-none">
                        <Button className={cn(
                            "w-full transition-all duration-300",
                            isHiddenMode
                                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] border-purple-500/50"
                                : "bg-white text-black hover:bg-white/90"
                        )}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Note
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className={cn(
                        "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                        isHiddenMode ? "text-purple-400/50 group-hover:text-purple-400" : "text-muted-foreground"
                    )} />
                    <Input
                        placeholder="Search documentation..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                            "pl-9 transition-all duration-300",
                            isHiddenMode
                                ? "bg-black/40 border-purple-500/20 text-purple-100 placeholder:text-purple-500/30 focus:border-purple-500/50 focus:ring-purple-500/20"
                                : "bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-white/20"
                        )}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-white">
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-white">
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Notes Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : filteredNotes.length > 0 ? (
                <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredNotes.map((note) => (
                        <Link href={`/notes/${note._id}`} key={note._id}>
                            <Card className={cn(
                                "group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 h-full",
                                isHiddenMode
                                    ? "bg-black/40 border-purple-500/20 hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]"
                                    : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                            )}>
                                <CardHeader className="p-4 md:p-6 pb-2">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-lg font-medium text-white truncate pr-8">
                                            {note.title}
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 md:p-6 pt-2">
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {note.content?.replace(/[*#_`]/g, '') || "No content"}
                                    </p>
                                    {note.attachments?.length > 0 && (
                                        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                                            <Paperclip className="h-3 w-3" />
                                            {note.attachments.length} Attachment{note.attachments.length > 1 ? 's' : ''}
                                        </div>
                                    )}
                                </CardContent>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setNoteToDelete(note);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </Card>
                        </Link>
                    ))}
                </div >
            ) : (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                    <div className="h-16 w-16 rounded-xl bg-white/5 flex items-center justify-center mb-6">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-white">Buffer is Empty</h3>
                    <p className="text-muted-foreground mt-1 mb-6 text-center max-w-xs text-sm">
                        No technical fragments captured yet. Initialize a new documentation draft to begin.
                    </p>
                    <Link href="/notes/new">
                        <Button variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Draft First Note
                        </Button>
                    </Link>
                </div>
            )}

            <ConfirmModal
                isOpen={!!noteToDelete}
                onClose={() => setNoteToDelete(null)}
                onConfirm={() => noteToDelete && deleteNote(noteToDelete._id)}
                isLoading={isDeleting}
                title="Delete Documentation?"
                description={noteToDelete ? `This will permanently remove the note "${noteToDelete.title}". This action cannot be reversed.` : ""}
                confirmText="Delete Note"
                variant="destructive"
            />
        </div >
    );
}
