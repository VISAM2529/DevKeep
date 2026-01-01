"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { RichTextEditor } from "@/components/notes/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ChevronLeft,
    Save,
    Trash2,
    Loader2,
    FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function NoteEditorPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [projectId, setProjectId] = useState(searchParams.get("projectId") || "");
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const isNew = params.id === "new";

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsRes, noteRes] = await Promise.all([
                    fetch("/api/projects"),
                    !isNew ? fetch(`/api/notes/${params.id}`) : Promise.resolve(null)
                ]);

                const projectsData = await projectsRes.json();
                setProjects(projectsData.projects || []);

                if (noteRes && noteRes.ok) {
                    const data = await noteRes.json();
                    const note = data.note;
                    setTitle(note.title || "");
                    setContent(note.content || "");
                    setProjectId(note.projectId || "");
                }
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Sync Error",
                    description: "Failed to load buffer state.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.id, isNew, toast]);

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            toast({
                variant: "destructive",
                title: "Invalid Buffer",
                description: "Title and content segments are required.",
            });
            return;
        }

        setSaving(true);
        try {
            const url = isNew ? "/api/notes" : `/api/notes/${params.id}`;
            const method = isNew ? "POST" : "PUT";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content, projectId }),
            });

            if (!res.ok) throw new Error("Commit failure");

            toast({
                title: isNew ? "Note Created" : "Note Updated",
                description: `Successfully saved ${title}.`,
            });

            if (isNew) router.push("/notes");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Permanently wipe this document?")) return;

        try {
            const res = await fetch(`/api/notes/${params.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Wipe failure");

            toast({
                title: "Document Deleted",
                description: "Entry removed from history.",
            });
            router.push("/notes");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        }
    };

    if (loading) return (
        <div className="p-8 space-y-8 animate-pulse">
            <div className="h-4 w-24 bg-white/5 rounded" />
            <div className="h-12 w-full bg-white/5 rounded-xl" />
            <div className="h-[500px] w-full bg-white/5 rounded-2xl" />
        </div>
    );

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-6">
                <div>
                    <Link
                        href="/notes"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-4"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Notes
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-secondary/50 border border-white/5 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold tracking-tight text-white">
                                    {isNew ? "New Note" : "Edit Note"}
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {!isNew && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                    onClick={handleDelete}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                            <Button
                                className="h-10 px-6 gap-2"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Editor Surface */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Title</label>
                            <Input
                                placeholder="Note Title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="h-12 text-lg font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Project Scope</label>
                            <Select value={projectId} onValueChange={setProjectId}>
                                <SelectTrigger className="h-12 w-full">
                                    <SelectValue placeholder="Select Project" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="global">Global Archive</SelectItem>
                                    {projects.map((p: any) => (
                                        <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Content</label>
                        <RichTextEditor value={content} onChange={setContent} />
                    </div>
                </div>
            </div>
        </div>
    );
}
