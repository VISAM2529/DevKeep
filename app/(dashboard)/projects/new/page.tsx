import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkLimit } from "@/lib/subscription";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function NewProjectPage(props: {
    searchParams: Promise<{ communityId?: string }>;
}) {
    const searchParams = await props.searchParams;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return redirect("/login");
    }

    const canCreate = await checkLimit(session.user.id, "projects");

    if (!canCreate) {
        return (
            <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-6">
                    <Link
                        href="/projects"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Projects
                    </Link>
                </div>

                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed border-border/50 rounded-lg p-8 text-center bg-card/10">
                    <div className="bg-primary/10 p-4 rounded-full mb-4">
                        <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight mb-2">Project Limit Reached</h2>
                    <p className="text-muted-foreground max-w-md mb-6">
                        You have reached the maximum number of projects for your current plan.
                        Upgrade to Pro or Premium to create unlimited projects.
                    </p>
                    <div className="flex gap-4">
                        <Link href="/projects">
                            <Button variant="outline">Go Back</Button>
                        </Link>
                        <Link href="/subscription">
                            <Button>Upgrade Plan</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
                <ProjectForm communityId={searchParams.communityId} />
            </div>
        </div>
    );
}
