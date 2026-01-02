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
import { Loader2 } from "lucide-react";

const communitySchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    icon: z.string().optional(),
});

type CommunityFormValues = z.infer<typeof communitySchema>;

interface CommunityFormProps {
    initialData?: any;
    onSuccess?: () => void;
}

export function CommunityForm({ initialData, onSuccess }: CommunityFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<CommunityFormValues>({
        resolver: zodResolver(communitySchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            icon: initialData?.icon || "",
        },
    });

    const onSubmit = async (data: CommunityFormValues) => {
        setIsLoading(true);
        try {
            const url = initialData?._id
                ? `/api/communities/${initialData._id}`
                : "/api/communities";
            const method = initialData?._id ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Failed to save community");

            toast({
                title: initialData?._id ? "Community Updated" : "Community Created",
                description: `Your community has been ${initialData?._id ? "updated" : "established"}.`,
            });

            if (onSuccess) {
                onSuccess();
            } else {
                router.refresh();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save community.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Frontend Team" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="What is this community all about?"
                                    className="min-h-[100px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData?._id ? "Update Community" : "Create Community"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
