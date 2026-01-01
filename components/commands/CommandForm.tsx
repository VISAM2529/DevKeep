"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Terminal, Tag, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const commandSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters."),
    command: z.string().min(1, "Command content is required."),
    description: z.string(),
    category: z.enum(["VSCode", "Git", "Docker", "NPM", "Server", "Other"]),
    tags: z.array(z.string()),
    projectId: z.string(),
});

type CommandFormValues = z.infer<typeof commandSchema>;

interface CommandFormProps {
    initialData?: any;
    projects?: any[];
    onSuccess?: () => void;
}

export function CommandForm({ initialData, projects = [], onSuccess }: CommandFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [tagInput, setTagInput] = useState("");

    const form = useForm<CommandFormValues>({
        resolver: zodResolver(commandSchema),
        defaultValues: {
            title: initialData?.title || "",
            command: initialData?.command || "",
            description: initialData?.description || "",
            category: initialData?.category || "Other",
            tags: initialData?.tags || [],
            projectId: initialData?.projectId || "",
        },
    });

    const addTag = () => {
        const val = tagInput.trim().toLowerCase();
        if (val && !form.getValues("tags").includes(val)) {
            form.setValue("tags", [...form.getValues("tags"), val]);
            setTagInput("");
        }
    };

    const removeTag = (tag: string) => {
        form.setValue(
            "tags",
            form.getValues("tags").filter((t) => t !== tag)
        );
    };

    async function onSubmit(values: CommandFormValues) {
        setIsLoading(true);
        try {
            const url = initialData?._id
                ? `/api/commands/${initialData._id}`
                : "/api/commands";
            const method = initialData?._id ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!res.ok) throw new Error("Failed to save command snippet");

            toast({
                title: initialData?._id ? "Snippet Recoded" : "Snippet Initialized",
                description: `Successfully ${initialData?._id ? "updated" : "added"} ${values.title} to your library.`,
            });

            if (onSuccess) {
                onSuccess();
            } else {
                router.push("/commands");
                router.refresh();
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Buffer Error",
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Snippet Title</FormLabel>
                                <FormControl>
                                    <div className="relative group">
                                        <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="E.g. Start Microservice" className="pl-9" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="command"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Terminal Command</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="npm run dev --port 3000"
                                        className="min-h-[100px] font-mono text-sm"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {["VSCode", "Git", "Docker", "NPM", "Server", "Other"].map((cat) => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="projectId"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Project Scope</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Global / Any Project" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="global">Global / Any Project</SelectItem>
                                            {projects.map((p) => (
                                                <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-3">
                        <FormLabel>Tags</FormLabel>
                        <div className="flex gap-2">
                            <div className="relative group flex-1">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Add tag (e.g. production, linux)"
                                    className="pl-9"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                                />
                            </div>
                            <Button type="button" onClick={addTag} variant="outline" size="icon">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {form.watch("tags").map((tag) => (
                                <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="hover:bg-primary/20 rounded-full p-0.5 ml-1"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="min-w-[140px]"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : initialData?._id ? (
                            "Update Snippet"
                        ) : (
                            "Commit Snippet"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
