import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import Community from "@/models/Community";

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

        // Verify membership
        const community = await Community.findById(id);
        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        const isMember = community.members.some(
            (m: any) => m.userId.toString() === session.user.id
        ) || community.ownerId.toString() === session.user.id;

        if (!isMember) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Update all unread messages in this community for this user
        // We add the user to the readBy array if they are not already there
        await Message.updateMany(
            {
                communityId: id,
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
