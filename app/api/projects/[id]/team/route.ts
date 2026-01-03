import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import User from "@/models/User";

// GET /api/projects/[id]/team
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

        const project = await Project.findById(id);
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const isOwner = project.userId.toString() === session.user.id;
        // Basic check: requester must be associated with project? 
        // Or at least allow collaborators to see team.

        // Collect emails
        const emails = project.sharedWith.map((c: any) => c.email);

        // Find users by emails
        // Also include Owner
        const owner = await User.findById(project.userId).select("name email image");
        const collaborators = await User.find({ email: { $in: emails } }).select("name email image");

        const team = [owner, ...collaborators].filter(Boolean);

        return NextResponse.json(team);

    } catch (error) {
        console.error("Fetch team error:", error);
        return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
    }
}
