import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import Message from "@/models/Message";
import { z } from "zod";

const messageSchema = z.object({
    content: z.string().min(1, "Message cannot be empty"),
});

// GET /api/projects/[id]/messages
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
            (c: any) => c.email === session.user.email
        ); // Note: Project model uses email for sharedWith, not userId ref usually? 
        // Let me check Project model. Yes, sharedWith has { email, role, accepted }.
        // So check by email.

        if (!isOwner && !isCollaborator) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const messages = await Message.find({ projectId: id })
            .populate("senderId", "name email image")
            .populate("readBy.userId", "name")
            .sort({ createdAt: 1 })
            .limit(50);

        return NextResponse.json(messages);
    } catch (error) {
        console.error("Fetch messages error:", error);
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }
}

// POST /api/projects/[id]/messages
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
        const { content } = messageSchema.parse(body);

        await connectDB();

        const project = await Project.findById(id);
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const isOwner = project.userId.toString() === session.user.id;
        // Check if collaborator AND accepted?
        // Ideally only accepted collaborators can chat.
        const collaborator = project.sharedWith.find(
            (c: any) => c.email === session.user.email
        );
        const isCollaborator = collaborator && collaborator.accepted;

        if (!isOwner && !isCollaborator) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const message = await Message.create({
            projectId: id,
            senderId: session.user.id,
            content,
            readBy: [{ userId: session.user.id, readAt: new Date() }]
        });

        // Populate sender info for immediate display
        await message.populate("senderId", "name email image");

        return NextResponse.json(message);

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error("Send message error:", error);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}
