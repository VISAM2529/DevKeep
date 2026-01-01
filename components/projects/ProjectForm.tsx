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
import { Badge } from "@/components/ui/badge";
import { X, Upload, Loader2, Plus } from "lucide-react";
import Image from "next/image";

const projectSchema = z.object({
    name: z.string().min(2, "Project name must be at least 2 characters."),
    description: z.string().min(10, "Description must be at least 10 characters."),
    techStack: z.array(z.string()).min(1, "Add at least one technology."),
    repositoryUrl: z.string(),
    liveUrl: z.string(),
    environment: z.string(),
    status: z.string(),
});

type ProjectFormValues = {
    name: string;
    description: string;
    techStack: string[];
    repositoryUrl: string;
    liveUrl: string;
    environment: string;
    status: string;
};

interface ProjectFormProps {
    initialData?: any;
    communityId?: string;
}

export function ProjectForm({ initialData, communityId }: ProjectFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [techInput, setTechInput] = useState("");
    const [logoUrl, setLogoUrl] = useState(initialData?.logo || "");

    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            techStack: initialData?.techStack || [],
            repositoryUrl: initialData?.repositoryUrl || "",
            liveUrl: initialData?.liveUrl || "",
            environment: initialData?.environment || "Local",
            status: initialData?.status || "Active",
        },
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
                setLogoUrl(data.url);
                toast({ title: "Image uploaded successfully" });
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Upload failed",
                description: error.message,
            });
        } finally {
            setIsUploading(false);
        }
    };

    const addTech = () => {
        const val = techInput.trim();
        if (val && !form.getValues("techStack").includes(val)) {
            form.setValue("techStack", [...form.getValues("techStack"), val]);
            setTechInput("");
        }
    };

    const removeTech = (tech: string) => {
        form.setValue(
            "techStack",
            form.getValues("techStack").filter((t) => t !== tech)
        );
    };

    async function onSubmit(values: ProjectFormValues) {
        setIsLoading(true);
        try {
            const url = initialData?._id
                ? `/api/projects/${initialData._id}`
                : "/api/projects";
            const method = initialData?._id ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...values, logo: logoUrl, communityId }),
            });

            if (!res.ok) throw new Error("Failed to save project");

            toast({
                title: initialData?._id ? "Project updated" : "Project created",
                description: `Successfully ${initialData?._id ? "updated" : "created"} ${values.name}`,
            });

            if (communityId) {
                router.push(`/communities/${communityId}`);
            } else {
                router.push("/projects");
            }
            router.refresh();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Project Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="E.g. DevKeep Platform" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="What is this project about?"
                                            className="min-h-[120px] resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-3">
                            <FormLabel>Tech Stack</FormLabel>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter technology (e.g. Next.js)"
                                    value={techInput}
                                    onChange={(e) => setTechInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech())}
                                />
                                <Button type="button" onClick={addTech} variant="outline" size="icon">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {form.watch("techStack").map((tech) => (
                                    <Badge key={tech} variant="secondary" className="gap-1 pr-1 font-medium text-xs">
                                        {tech}
                                        <button
                                            type="button"
                                            onClick={() => removeTech(tech)}
                                            className="hover:bg-background/20 rounded-full p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            {form.formState.errors.techStack && (
                                <p className="text-destructive text-xs">{form.formState.errors.techStack.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <FormLabel>Project Logo</FormLabel>
                            <div className="relative group aspect-square max-w-[200px] mx-auto md:mx-0">
                                {logoUrl ? (
                                    <div className="relative w-full h-full rounded-xl overflow-hidden border border-border/40">
                                        <Image src={logoUrl} alt="Logo" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <label className="cursor-pointer p-4 bg-primary rounded-full shadow-lg">
                                                <Upload className="h-4 w-4 text-primary-foreground" />
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-full rounded-xl border-2 border-dashed border-border/40 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/50 transition-all cursor-pointer">
                                        {isUploading ? (
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        ) : (
                                            <>
                                                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                                                <span className="text-xs text-muted-foreground font-medium">Upload Logo</span>
                                            </>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <FormField
                                control={form.control}
                                name="repositoryUrl"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Repository URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://github.com/..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="liveUrl"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Live URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4 border-t border-border/40 pt-6">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading || isUploading}
                        className="px-8"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : initialData?._id ? (
                            "Update Project"
                        ) : (
                            "Create Project"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
