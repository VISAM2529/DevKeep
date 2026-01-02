import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";
import Project from "@/models/Project";
import { z } from "zod";

const taskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    status: z.enum(["To Do", "In Progress", "Done"]).optional(),
    priority: z.enum(["Low", "Medium", "High"]).optional(),
    deadline: z.string().optional(), // Receive as string, convert to Date
    assigneeId: z.string().optional(), // User ID
});

// GET /api/projects/[id]/tasks
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Verify project access
        const project = await Project.findById(id);
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const isOwner = project.userId.toString() === session.user.id;
        const isCollaborator = project.sharedWith.some(
            (c: any) => c.email === session.user.email?.toLowerCase() && c.accepted === true
        );

        if (!isOwner && !isCollaborator) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Fetch tasks
        const tasks = await Task.find({ projectId: id })
            .populate("assigneeId", "name email image")
            .populate("creatorId", "name")
            .sort({ createdAt: -1 });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Fetch tasks error:", error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}

// POST /api/projects/[id]/tasks
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const parsed = taskSchema.parse(body);

        await connectDB();

        const project = await Project.findById(id);
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const isOwner = project.userId.toString() === session.user.id;
        const collaborator = project.sharedWith.find(
            (c: any) => c.email === session.user.email?.toLowerCase() && c.accepted === true
        );

        // Check if user is Community Admin
        let isCommunityAdmin = false;
        if (project.communityId) {
            const Community = (await import("@/models/Community")).default;
            const community = await Community.findById(project.communityId);
            if (community) {
                isCommunityAdmin = community.members.some(
                    (m: any) => m.userId.toString() === session.user.id && m.role === "admin"
                ) || community.ownerId.toString() === session.user.id;
            }
        }

        // Allow Owner, Admin, Project Lead, or Community Admin to manage tasks
        const hasTaskManagementPrivileges = isOwner || isCommunityAdmin ||
            (collaborator && (collaborator.role === "Admin" || collaborator.role === "Project Lead"));

        if (!hasTaskManagementPrivileges) {
            return NextResponse.json({
                error: "Only Project Leads, Admins, or Community Admins can create and assign tasks"
            }, { status: 403 });
        }

        const task = await Task.create({
            projectId: id,
            title: parsed.title,
            description: parsed.description,
            status: parsed.status,
            priority: parsed.priority,
            deadline: parsed.deadline ? new Date(parsed.deadline) : undefined,
            assigneeId: parsed.assigneeId,
            creatorId: session.user.id,
        });

        await task.populate("assigneeId", "name email image");

        return NextResponse.json(task);

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error("Create task error:", error);
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
}
