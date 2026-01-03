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
import { useHiddenSpace } from "@/components/providers/HiddenSpaceProvider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Globe } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

const credentialSchema = z.object({
    platform: z.string().min(2, "Platform name/service is required."),
    username: z.string().min(1, "Username/Email is required."),
    password: z.string().min(1, "Password is required."),
    projectId: z.string(),
    notes: z.string(),
});

type CredentialFormValues = z.infer<typeof credentialSchema>;

interface CredentialFormProps {
    initialData?: any;
    projects?: any[];
    onSuccess?: () => void;
}

export function CredentialForm({ initialData, projects = [], onSuccess }: CredentialFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { isHiddenMode } = useHiddenSpace();
    const [isLoading, setIsLoading] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [pendingValues, setPendingValues] = useState<CredentialFormValues | null>(null);

    const form = useForm<CredentialFormValues>({
        resolver: zodResolver(credentialSchema),
        defaultValues: {
            platform: initialData?.platform || "",
            username: initialData?.username || "",
            password: initialData?.password || "",
            projectId: initialData?.projectId || "",
            notes: initialData?.notes || "",
        },
    });

    async function processSubmit(values: CredentialFormValues) {
        setIsLoading(true);
        try {
            const url = initialData?._id
                ? `/api/credentials/${initialData._id}`
                : "/api/credentials";
            const method = initialData?._id ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...values, isHidden: isHiddenMode }),
            });

            if (!res.ok) throw new Error("Failed to save credential");

            toast({
                title: initialData?._id ? "Credential Updated" : "Credential Created",
                description: `Successfully ${initialData?._id ? "updated" : "added"} ${values.platform} credential.`,
            });

            if (onSuccess) {
                onSuccess();
            } else {
                router.push("/credentials");
                router.refresh();
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setIsLoading(false);
            setShowUpdateModal(false);
        }
    }

    async function onSubmit(values: CredentialFormValues) {
        if (initialData?._id) {
            setPendingValues(values);
            setShowUpdateModal(true);
        } else {
            await processSubmit(values);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="platform"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Platform / Service</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="E.g. AWS, GitHub, Vercel" className="pl-9" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Username / ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="dev@kernel.org" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Secret Key / Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input type="password" placeholder="••••••••••••" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="projectId"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Project</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a project" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="global">Global / No Project</SelectItem>
                                        {projects.map((p) => (
                                            <SelectItem key={p._id} value={p._id}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Security Notes (Optional)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Add context about this access key..."
                                        className="min-h-[100px] resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="px-8"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : initialData?._id ? (
                            "Update Credential"
                        ) : (
                            "Create Credential"
                        )}
                    </Button>
                </div>
            </form>

            <ConfirmModal
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                onConfirm={() => pendingValues && processSubmit(pendingValues)}
                isLoading={isLoading}
                title="Update Credential?"
                description={`You are about to modify the access keys for ${pendingValues?.platform}. Ensure you have the correct information before proceeding.`}
                confirmText="Verify and Update"
                variant="warning"
            />
        </Form>
    );
}
