"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    List
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function NotesPage() {
    const { toast } = useToast();
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchNotes = async () => {
        try {
            const res = await fetch("/api/notes");
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

    useEffect(() => {
        fetchNotes();
    }, []);

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
                    <p className="text-muted-foreground max-w-md text-xs md:text-sm">
                        Maintain your technical debt, architectural decisions, and project-specific knowledge bases.
                    </p>
                </div>

                <Link href="/notes/new" className="w-full md:w-auto">
                    <Button className="w-full h-10 px-4 gap-2 text-sm font-medium">
                        <Plus className="h-4 w-4" />
                        Draft Note
                    </Button>
                </Link>
            </div>

            {/* Utility Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative group flex-1 max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search document fragments..."
                        className="pl-9 h-10 bg-secondary/20 border-white/5"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNotes.map((note) => (
                        <Link key={note._id} href={`/notes/${note._id}`}>
                            <Card className="group h-full hover:bg-secondary/30 transition-all duration-300">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline" className="text-[10px] font-medium border-white/10 text-muted-foreground">
                                            {note.projectId?.name || "Global Frame"}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(note.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-1">
                                        {note.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4 min-h-[60px]">
                                        {note.content.replace(/[#*`]/g, "")}
                                    </p>
                                    <div className="flex items-center justify-end pt-2 border-t border-white/5">
                                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
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
        </div>
    );
}
