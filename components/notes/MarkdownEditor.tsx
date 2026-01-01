"use client";

import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, Eye, Image as ImageIcon, Loader2, Columns, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertAtCursor = (textToInsert: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            onChange(value + textToInsert);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.substring(0, start) + textToInsert + value.substring(end);

        onChange(newValue);

        // Restore focus and cursor position after state update
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
        }, 0);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.url) {
                const markdownImage = `\n![Image](${data.url})\n`;
                insertAtCursor(markdownImage);
                toast({ title: "Image integrated into document" });
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Upload Error",
                description: error.message,
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
            <Tabs defaultValue="edit" className="w-full">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-secondary/20">
                    <TabsList className="bg-transparent border-none p-0 h-auto">
                        <TabsTrigger value="edit" className="gap-2 data-[state=active]:bg-transparent data-[state=active]:text-primary text-xs h-8">
                            <Edit3 className="h-3.5 w-3.5" /> Edit
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="gap-2 data-[state=active]:bg-transparent data-[state=active]:text-primary text-xs h-8">
                            <Eye className="h-3.5 w-3.5" /> Preview
                        </TabsTrigger>
                        <TabsTrigger value="split" className="gap-2 data-[state=active]:bg-transparent data-[state=active]:text-primary text-xs h-8 hidden md:flex">
                            <Columns className="h-3.5 w-3.5" /> Split
                        </TabsTrigger>
                    </TabsList>
                    <div>
                        <label className="cursor-pointer">
                            <Button variant="ghost" size="sm" className="h-8 text-xs gap-2 text-muted-foreground hover:text-white" asChild>
                                <span>
                                    {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                                    Add Image
                                </span>
                            </Button>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </label>
                    </div>
                </div>

                <TabsContent value="edit" className="mt-0 p-0">
                    <Textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder || "Start documenting your architectural decisions..."}
                        className="min-h-[500px] rounded-none border-none bg-background focus-visible:ring-0 font-mono text-sm leading-relaxed p-6 resize-none"
                    />
                </TabsContent>

                <TabsContent value="preview" className="mt-0 p-0">
                    <div className="min-h-[500px] bg-background p-8 prose prose-invert max-w-none prose-pre:bg-secondary/50 prose-pre:border prose-pre:border-border/40">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({ node, inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || "");
                                    return !inline && match ? (
                                        <SyntaxHighlighter
                                            style={atomDark}
                                            language={match[1]}
                                            PreTag="div"
                                            {...props}
                                        >
                                            {String(children).replace(/\n$/, "")}
                                        </SyntaxHighlighter>
                                    ) : (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    );
                                },
                            }}
                        >
                            {value || "*No content to render. Switch to Syntax mode to begin.*"}
                        </ReactMarkdown>
                    </div>
                </TabsContent>

                <TabsContent value="split" className="mt-0 p-0">
                    <div className="grid grid-cols-2 min-h-[500px] divide-x divide-border/40">
                        <div className="p-0">
                            <Textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                placeholder={placeholder || "Documenting..."}
                                className="h-full min-h-[500px] rounded-none border-none bg-background focus-visible:ring-0 font-mono text-sm leading-relaxed p-6 resize-none"
                            />
                        </div>
                        <div className="p-8 bg-background prose prose-invert max-w-none overflow-y-auto max-h-[600px] prose-img:rounded-xl prose-img:border prose-img:border-border/40">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({ node, inline, className, children, ...props }: any) {
                                        const match = /language-(\w+)/.exec(className || "");
                                        return !inline && match ? (
                                            <SyntaxHighlighter
                                                style={atomDark}
                                                language={match[1]}
                                                PreTag="div"
                                                {...props}
                                            >
                                                {String(children).replace(/\n$/, "")}
                                            </SyntaxHighlighter>
                                        ) : (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    img: ({ node, ...props }: any) => (
                                        <div className="my-8 group relative inline-block w-full">
                                            <img {...props} className="rounded-xl border border-white/10 mx-auto max-h-[400px] object-contain transition-transform group-hover:scale-[1.01]" />
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="h-8 w-8 rounded-lg"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(props.src || "");
                                                        toast({ title: "Image URL copied" });
                                                    }}
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                }}
                            >
                                {value || "*Live preview will appear here.*"}
                            </ReactMarkdown>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
