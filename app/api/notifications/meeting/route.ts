import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";
import Project from "@/models/Project";
import Community from "@/models/Community";
import User from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId, communityId } = await req.json();

        if (!projectId && !communityId) {
            return NextResponse.json({ error: "Project ID or Community ID required" }, { status: 400 });
        }

        await connectDB();

        let recipients: string[] = [];
        let title = "";
        let message = "";
        let link = "";
        let contextId: any = {};

        if (projectId) {
            const project = await Project.findById(projectId).populate("sharedWith.email");
            if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

            // Get all member user IDs (excluding sender)
            // Note: In real app, we need to map emails to userIds. 
            // Assuming sharedWith has unified user mapping or we fetch users by email.
            // For simplicity/speed, let's assume we fetch users by email from User model if needed, 
            // OR if sharedWith stores emails, we need to find Users with those emails.
            // Check Project model: sharedWith has email and role. 
            // We need to find User documents for these emails.
            const emails = project.sharedWith.map((m: any) => m.email);
            // Also include owner if sender is not owner ?? (Owner is in project.owner?)
            // actually project.owner is an ID usually.

            // Find all users who are members (including owner)
            const members = await User.find({
                $or: [
                    { email: { $in: emails } },
                    { _id: (project as any).owner || (project as any).ownerId }
                ]
            });

            recipients = members
                .filter((u: any) => u._id.toString() !== session.user.id)
                .map((u: any) => u._id);

            title = "Meeting Started";
            message = `A meeting has started in project: ${project.name}`;
            link = `/projects/${projectId}?join=true`;
            contextId = { projectId };

            // Set meeting active
            await Project.findByIdAndUpdate(projectId, { isMeetingActive: true });
        }
        else if (communityId) {
            const community = await Community.findById(communityId).populate("members.userId");
            if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });

            recipients = community.members
                .filter((m: any) => m.userId._id.toString() !== session.user.id)
                .map((m: any) => m.userId._id);

            // Also owner
            const creatorId = (community as any).createdBy;
            if (creatorId.toString() !== session.user.id && !recipients.includes(creatorId)) {
                recipients.push(creatorId);
            }

            title = "Community Meeting";
            message = `A meeting has started in community: ${community.name}`;
            link = `/communities/${communityId}?join=true`;
            contextId = { communityId };

            // Set meeting active
            await Community.findByIdAndUpdate(communityId, { isMeetingActive: true });
        }

        if (recipients.length === 0) {
            return NextResponse.json({ message: "No recipients to notify" }, { status: 200 });
        }

        // Create notifications in bulk
        const notifications = recipients.map(recipientId => ({
            recipientId,
            senderId: session.user.id,
            type: "meeting_started",
            title,
            message,
            link,
            ...contextId,
            read: false
        }));

        await Notification.insertMany(notifications);

        return NextResponse.json({ success: true, count: notifications.length }, { status: 200 });
    } catch (error) {
        console.error("Meeting notification error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
