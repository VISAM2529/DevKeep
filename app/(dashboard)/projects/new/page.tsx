"use client";

import { ProjectForm } from "@/components/projects/ProjectForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function NewProjectContent() {
    const searchParams = useSearchParams();
    const communityId = searchParams.get("communityId");

    return <ProjectForm communityId={communityId || undefined} />;
}

export default function NewProjectPage() {
    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="space-y-6">
                <Link
                    href="/projects"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Projects
                </Link>

                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-white">New Project</h1>
                    <p className="text-muted-foreground max-w-md text-sm">
                        Create a new workspace for your project resources.
                    </p>
                </div>
            </div>

            {/* Form Section */}
            <div>
                <Suspense fallback={<div>Loading form...</div>}>
                    <NewProjectContent />
                </Suspense>
            </div>
        </div>
    );
}
