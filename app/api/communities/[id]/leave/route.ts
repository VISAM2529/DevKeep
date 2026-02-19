import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Community from "@/models/Community";
import Notification from "@/models/Notification";
import User from "@/models/User";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // Correctly await params
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params; // Await params here

        await connectDB();

        const community = await Community.findById(id);
        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        // Check if user is the owner
        if (community.ownerId.toString() === session.user.id) {
            return NextResponse.json(
                { error: "Owner cannot leave the community. Delete it instead." },
                { status: 400 }
            );
        }

        // Check if user is a member
        const isMember = community.members.some(
            (member) => member.userId.toString() === session.user.id
        );

        if (!isMember) {
            return NextResponse.json(
                { error: "You are not a member of this community" },
                { status: 400 }
            );
        }

        // Remove user from members
        await Community.findByIdAndUpdate(id, {
            $pull: { members: { userId: session.user.id } },
        });

        // Notify the owner
        // Fetch user's name for the notification
        const leavingUser = await User.findById(session.user.id).select("name");
        const userName = leavingUser?.name || "A user";

        await Notification.create({
            recipientId: community.ownerId,
            senderId: session.user.id,
            type: "community_event", // Or 'system' if more appropriate, but 'community_event' fits
            title: "Member Left Community",
            message: `${userName} has left the community "${community.name}".`,
            communityId: community._id,
            read: false,
        });

        return NextResponse.json({ message: "Successfully left the community" });
    } catch (error: any) {
        console.error("POST /api/communities/[id]/leave error:", error);
        return NextResponse.json(
            { error: "Failed to leave community" },
            { status: 500 }
        );
    }
}
