import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Community from "@/models/Community";

// POST /api/communities/[id]/accept - Accept invitation
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

        const community = await Community.findById(id);
        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        // Find the pending member entry
        const memberIndex = community.members.findIndex(
            (m: any) => m.userId.toString() === session.user.id && m.accepted === false
        );

        if (memberIndex === -1) {
            return NextResponse.json({ error: "No pending invitation found" }, { status: 404 });
        }

        // Update accepted status
        community.members[memberIndex].accepted = true;
        await community.save();

        return NextResponse.json({
            message: "Invitation accepted",
            communityId: community._id
        });

    } catch (error: any) {
        console.error("Accept invite error:", error);
        return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 });
    }
}

// DELETE /api/communities/[id]/accept - Decline invitation
export async function DELETE(
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

        const community = await Community.findById(id);
        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        // Remove the member entry where accepted is false
        // We could just filter it out
        const initialCount = community.members.length;
        community.members = community.members.filter(
            (m: any) => !(m.userId.toString() === session.user.id && m.accepted === false)
        );

        if (community.members.length === initialCount) {
            return NextResponse.json({ error: "No pending invitation found to decline" }, { status: 404 });
        }

        await community.save();

        return NextResponse.json({ message: "Invitation declined" });

    } catch (error: any) {
        console.error("Decline invite error:", error);
        return NextResponse.json({ error: "Failed to decline invitation" }, { status: 500 });
    }
}
