import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import Message from "@/models/Message";

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

        await connectDB();

        // Verify project access
        const project = await Project.findById(id);
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const isOwner = project.userId.toString() === session.user.id;
        const collaborator = project.sharedWith.find(
            (c: any) => c.email === session.user.email
        );
        const isCollaborator = collaborator; // Allow even pending to read? Probably fine, or restrict to accepted.

        if (!isOwner && !isCollaborator) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Update unread messages
        await Message.updateMany(
            {
                projectId: id,
                "readBy.userId": { $ne: session.user.id }
            },
            {
                $addToSet: {
                    readBy: {
                        userId: session.user.id,
                        readAt: new Date()
                    }
                }
            }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Mark read error:", error);
        return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 });
    }
}
