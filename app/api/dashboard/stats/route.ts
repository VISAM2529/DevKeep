import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import Credential from "@/models/Credential";
import Command from "@/models/Command";
import Note from "@/models/Note";

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const userEmail = session.user.email?.toLowerCase();

        // 1. Get all accessible projects (owned or accepted shared)
        const accessibleProjects = await Project.find({
            $or: [
                { userId: session.user.id },
                {
                    "sharedWith": {
                        $elemMatch: {
                            email: userEmail,
                            accepted: true
                        }
                    }
                }
            ]
        }).select("_id");

        const projectIds = accessibleProjects.map(p => p._id);

        // 2. Get pending invitations count
        const pendingInvitationsCount = await Project.countDocuments({
            "sharedWith": {
                $elemMatch: {
                    email: userEmail,
                    accepted: false
                }
            }
        });

        // 3. Get counts
        const [projectCount, credentialCount, commandCount, noteCount] = await Promise.all([
            Project.countDocuments({ _id: { $in: projectIds }, status: "Active" }),
            Credential.countDocuments({
                $or: [
                    { userId: session.user.id },
                    { projectId: { $in: projectIds } }
                ]
            }),
            Command.countDocuments({
                $or: [
                    { userId: session.user.id },
                    { projectId: { $in: projectIds } }
                ]
            }),
            Note.countDocuments({
                $or: [
                    { userId: session.user.id },
                    { projectId: { $in: projectIds } }
                ]
            }),
        ]);

        // 3. Get recent items
        const [recentProjects, recentCommands, recentNotes] = await Promise.all([
            Project.find({ _id: { $in: projectIds } }).sort({ updatedAt: -1 }).limit(5).select("name updatedAt"),
            Command.find({
                $or: [
                    { userId: session.user.id },
                    { projectId: { $in: projectIds } }
                ]
            }).sort({ updatedAt: -1 }).limit(5).select("title updatedAt"),
            Note.find({
                $or: [
                    { userId: session.user.id },
                    { projectId: { $in: projectIds } }
                ]
            }).sort({ updatedAt: -1 }).limit(5).select("title updatedAt"),
        ]);

        // Combine and format recent items for the dashboard feed
        const recentItems = [
            ...recentProjects.map(p => ({ _id: p._id, name: p.name, type: "Project", date: p.updatedAt })),
            ...recentCommands.map(c => ({ _id: c._id, name: c.title, type: "Command", date: c.updatedAt })),
            ...recentNotes.map(n => ({ _id: n._id, name: n.title, type: "Note", date: n.updatedAt })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

        return NextResponse.json({
            counts: {
                projects: projectCount,
                credentials: credentialCount,
                commands: commandCount,
                notes: noteCount,
                pendingInvitations: pendingInvitationsCount,
            },
            recentItems
        }, { status: 200 });
    } catch (error: any) {
        console.error("Get dashboard stats error:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard stats" },
            { status: 500 }
        );
    }
}
