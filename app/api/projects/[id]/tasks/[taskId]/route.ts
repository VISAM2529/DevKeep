import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";
import Project from "@/models/Project";
import { z } from "zod";

const taskUpdateSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["To Do", "In Progress", "Done"]).optional(),
    priority: z.enum(["Low", "Medium", "High"]).optional(),
    deadline: z.string().optional().nullable(),
    assigneeId: z.string().optional().nullable(),
});

// PUT /api/projects/[id]/tasks/[taskId]
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string; taskId: string }> }
) {
    try {
        const { id, taskId } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const parsed = taskUpdateSchema.parse(body);

        await connectDB();

        // Verify Project Access
        const project = await Project.findById(id);
        if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

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
                error: "Only Project Leads, Admins, or Community Admins can manage tasks"
            }, { status: 403 });
        }

        // Prepare update object
        const updateData: any = {
            ...parsed,
            deadline: parsed.deadline ? new Date(parsed.deadline) : parsed.deadline,
        };

        // Set completedAt when task is marked as Done
        if (parsed.status === "Done") {
            updateData.completedAt = new Date();
        } else if (parsed.status) {
            // Clear completedAt if status changes away from Done
            updateData.completedAt = null;
        }

        // Check for status change to trigger notification
        const oldTask = await Task.findById(taskId);
        const statusChanged = parsed.status && oldTask && oldTask.status !== parsed.status;

        const task = await Task.findOneAndUpdate(
            { _id: taskId, projectId: id },
            { $set: updateData },
            { new: true }
        ).populate("assigneeId", "name email image");

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // Trigger Notification for Owner/Admin on status change
        if (statusChanged && session.user.id !== project.userId.toString()) {
            const Notification = (await import("@/models/Notification")).default;
            await Notification.create({
                recipientId: project.userId,
                senderId: session.user.id,
                type: "task_update",
                title: "Task Status Updated",
                message: `Task "${task.title}" status changed to ${task.status} by ${session.user.name}`,
                link: `/projects/${id}`,
                projectId: id,
            });
        }

        return NextResponse.json(task);

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error("Update task error:", error);
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
}

// DELETE /api/projects/[id]/tasks/[taskId]
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; taskId: string }> }
) {
    try {
        const { id, taskId } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const project = await Project.findById(id);
        if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

        const isOwner = project.userId.toString() === session.user.id;

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

        const task = await Task.findOne({ _id: taskId, projectId: id });
        if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

        const isCreator = task.creatorId.toString() === session.user.id;

        // Check if user is Project Lead
        const collaborator = project.sharedWith.find(
            (c: any) => c.email === session.user.email?.toLowerCase() && c.accepted === true
        );
        const isProjectLead = collaborator && (collaborator.role === "Project Lead" || collaborator.role === "Admin");

        if (!isOwner && !isCreator && !isCommunityAdmin && !isProjectLead) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        await Task.deleteOne({ _id: taskId });
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete task error:", error);
        return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }
}
