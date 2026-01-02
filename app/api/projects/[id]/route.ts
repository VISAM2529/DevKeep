import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import Credential from "@/models/Credential";
import Command from "@/models/Command";
import Note from "@/models/Note";
import mongoose from "mongoose";
import { z } from "zod";

const projectSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
    techStack: z.array(z.string()).optional(),
    repositoryUrl: z.string().url().optional().or(z.literal("")),
    liveUrl: z.string().url().optional().or(z.literal("")),
    environment: z.enum(["Local", "Staging", "Production"]).optional(),
    status: z.enum(["Active", "Archived"]).optional(),
    logo: z.string().optional(),
    banner: z.string().optional(),
});

// GET /api/projects/[id] - Get single project
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await connectDB();

        const userEmail = session.user.email?.toLowerCase();

        const project = await Project.findOne({
            _id: id,
            $or: [
                { userId: new mongoose.Types.ObjectId(session.user.id) },
                {
                    "sharedWith": {
                        $elemMatch: {
                            email: userEmail,
                            accepted: true
                        }
                    }
                }
            ]
        }).populate("userId", "email name");

        if (!project) {
            return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
        }

        return NextResponse.json({ project }, { status: 200 });
    } catch (error: any) {
        console.error("Get project error:", error);
        return NextResponse.json(
            { error: "Failed to fetch project" },
            { status: 500 }
        );
    }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const validatedData = projectSchema.partial().parse(body);

        await connectDB();

        const userEmail = session.user.email?.toLowerCase();

        const projectToUpdate = await Project.findById(id);
        if (!projectToUpdate) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const isOwner = projectToUpdate.userId.toString() === session.user.id;
        const isCollaborator = projectToUpdate.sharedWith.some(
            (c: any) => c.email === userEmail && c.accepted === true
        );

        let isCommunityAdmin = false;
        if (projectToUpdate.communityId) {
            const Community = (await import("@/models/Community")).default;
            const community = await Community.findById(projectToUpdate.communityId);
            if (community) {
                isCommunityAdmin = community.members.some(
                    (m: any) => m.userId.toString() === session.user.id && m.role === "admin"
                ) || community.ownerId.toString() === session.user.id;
            }
        }

        if (!isOwner && !isCollaborator && !isCommunityAdmin) {
            return NextResponse.json({ error: "Permission denied" }, { status: 403 });
        }

        const project = await Project.findByIdAndUpdate(
            id,
            validatedData,
            { new: true, runValidators: true }
        );

        if (!project) {
            return NextResponse.json({ error: "Project not found or permission denied" }, { status: 404 });
        }

        return NextResponse.json({ project }, { status: 200 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        console.error("Update project error:", error);
        return NextResponse.json(
            { error: "Failed to update project" },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[id] - Delete project and all related data
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await connectDB();

        const projectToDelete = await Project.findById(id);
        if (!projectToDelete) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const isOwner = projectToDelete.userId.toString() === session.user.id;

        let isCommunityAdmin = false;
        if (projectToDelete.communityId) {
            const Community = (await import("@/models/Community")).default;
            const community = await Community.findById(projectToDelete.communityId);
            if (community) {
                isCommunityAdmin = community.members.some(
                    (m: any) => m.userId.toString() === session.user.id && m.role === "admin"
                ) || community.ownerId.toString() === session.user.id;
            }
        }

        if (!isOwner && !isCommunityAdmin) {
            return NextResponse.json({ error: "Only project owners or community admins can delete this project" }, { status: 403 });
        }

        await Project.findByIdAndDelete(id);
        const project = projectToDelete;

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Cascade delete related data
        await Promise.all([
            Credential.deleteMany({ projectId: id }),
            Command.deleteMany({ projectId: id }),
            Note.deleteMany({ projectId: id }),
        ]);

        return NextResponse.json(
            { message: "Project deleted successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Delete project error:", error);
        return NextResponse.json(
            { error: "Failed to delete project" },
            { status: 500 }
        );
    }
}
