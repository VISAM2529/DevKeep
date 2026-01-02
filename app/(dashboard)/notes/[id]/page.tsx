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
    Paperclip,
    File,
    X,
    Plus,
    ExternalLink,
    RefreshCcw,
    Download,
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
    const [attachments, setAttachments] = useState<string[]>([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [viewerType, setViewerType] = useState<'google' | 'office'>('google');

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
                    setAttachments(note.attachments || []);
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            setAttachments((prev) => [...prev, data.url]);
            toast({
                title: "File Uploaded",
                description: `Successfully uploaded ${file.name}.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Upload Error",
                description: error.message,
            });
        } finally {
            setUploading(false);
        }
    };

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
                body: JSON.stringify({ title, content, projectId, attachments }),
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

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Paperclip className="h-4 w-4" />
                                Attachments
                            </label>
                            <div className="relative">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-2"
                                    disabled={uploading}
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                    Add Document
                                </Button>
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept=".doc,.docx,.xls,.xlsx,.pdf"
                                />
                            </div>
                        </div>

                        {attachments.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {attachments.map((url, index) => {
                                    const fileName = url.split('/').pop() || 'Attachment';
                                    const isExcel = url.toLowerCase().includes('.xls') || url.toLowerCase().includes('.xlsx');
                                    const isWord = url.toLowerCase().includes('.doc') || url.toLowerCase().includes('.docx');

                                    return (
                                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-secondary/20 group">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`h-8 w-8 rounded flex items-center justify-center shrink-0 ${isExcel ? 'bg-green-500/10 text-green-500' : isWord ? 'bg-blue-500/10 text-blue-500' : 'bg-secondary/50 text-muted-foreground'}`}>
                                                    <File className="h-4 w-4" />
                                                </div>
                                                <a
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-medium text-white truncate hover:underline"
                                                >
                                                    {fileName}
                                                </a>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {attachments.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Document Preview
                                </label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-[10px] gap-1.5"
                                        onClick={() => setViewerType(prev => prev === 'google' ? 'office' : 'google')}
                                    >
                                        <RefreshCcw className="h-3 w-3" />
                                        Switch Engine ({viewerType === 'google' ? 'Microsoft' : 'Google'})
                                    </Button>
                                    <a
                                        href={attachments[0]}
                                        download
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary/50 border border-white/5 text-[10px] font-medium text-white hover:bg-secondary/70 transition-colors"
                                    >
                                        <Download className="h-3 w-3" />
                                        Download
                                    </a>
                                </div>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-secondary/10 overflow-hidden h-[650px] w-full relative group">
                                {(() => {
                                    const url = attachments[0];
                                    const isPDF = url.toLowerCase().includes('.pdf');

                                    if (isPDF) {
                                        return (
                                            <iframe
                                                src={url}
                                                className="w-full h-full border-none"
                                                title="PDF Preview"
                                            />
                                        );
                                    }

                                    const googleUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
                                    const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;

                                    return (
                                        <iframe
                                            src={viewerType === 'google' ? googleUrl : officeUrl}
                                            className="w-full h-full border-none"
                                            title="Document Preview"
                                        />
                                    );
                                })()}
                                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a
                                        href={attachments[0]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-medium text-white hover:bg-black transition-colors"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        Open Original
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Content</label>
                        <RichTextEditor value={content} onChange={setContent} />
                    </div>
                </div>
            </div>
        </div>
    );
}
