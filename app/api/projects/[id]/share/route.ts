import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import User from "@/models/User";
import mongoose from "mongoose";
import { z } from "zod";

const shareSchema = z.object({
    email: z.string().email("Invalid email address"),
    role: z.enum(["Collaborator", "Admin", "Project Lead"]).default("Collaborator"),
});

// POST /api/projects/[id]/share - Add a collaborator
export async function POST(
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
        const { email, role } = shareSchema.parse(body);

        await connectDB();

        // 1. Verify project exists and requester is the owner
        const project = await Project.findOne({
            _id: id,
            userId: new mongoose.Types.ObjectId(session.user.id)
        });
        if (!project) {
            return NextResponse.json({ error: "Only project owners can share projects" }, { status: 403 });
        }

        // 2. Verify target user exists
        const targetUser = await User.findOne({ email: email.toLowerCase() });
        if (!targetUser) {
            return NextResponse.json({ error: "User with this email not found" }, { status: 404 });
        }

        // 3. Prevent self-sharing
        if (targetUser.email === session.user.email) {
            return NextResponse.json({ error: "You are already the owner of this project" }, { status: 400 });
        }

        // 4. Check if already shared
        if (!project.sharedWith) project.sharedWith = [];
        const existingMember = project.sharedWith.find(s => s.email === email.toLowerCase());
        if (existingMember) {
            return NextResponse.json({ error: "Project already shared with this user" }, { status: 400 });
        }

        // 5. Add collaborator
        project.sharedWith.push({
            email: email.toLowerCase(),
            role,
            addedAt: new Date(),
            accepted: false,
        });

        project.markModified("sharedWith");
        await project.save();

        return NextResponse.json({ message: "Project shared successfully", sharedWith: project.sharedWith }, { status: 200 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error("Share project error:", error);
        return NextResponse.json({ error: "Failed to share project" }, { status: 500 });
    }
}

// DELETE /api/projects/[id]/share?email=... - Remove a collaborator
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
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        await connectDB();

        // requester must be owner or removing themselves
        const project = await Project.findById(id);
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const isOwner = project.userId.toString() === session.user.id;
        const isSelfRemoving = session.user.email === email.toLowerCase();

        if (!isOwner && !isSelfRemoving) {
            return NextResponse.json({ error: "Permission denied" }, { status: 403 });
        }

        if (!project.sharedWith) project.sharedWith = [];
        project.sharedWith = project.sharedWith.filter(s => s.email !== email.toLowerCase());
        await project.save();

        return NextResponse.json({ message: "Collaborator removed", sharedWith: project.sharedWith }, { status: 200 });
    } catch (error: any) {
        console.error("Unshare project error:", error);
        return NextResponse.json({ error: "Failed to remove collaborator" }, { status: 500 });
    }
}
