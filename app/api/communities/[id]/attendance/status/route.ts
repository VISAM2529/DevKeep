import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Community from "@/models/Community";

// GET /api/communities/[id]/attendance/status - Check current user's attendance status
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

        // Verify community membership
        const community = await Community.findById(id);
        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        const isMember = community.members.some(
            (m: any) => m.userId.toString() === session.user.id
        );

        if (!isMember) {
            return NextResponse.json({ error: "Not a community member" }, { status: 403 });
        }

        // Find active session
        const activeSession = await Attendance.findOne({
            userId: session.user.id,
            communityId: id,
            status: "active",
        });

        return NextResponse.json({
            isActive: !!activeSession,
            session: activeSession,
        });
    } catch (error: any) {
        console.error("Status check error:", error);
        return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
    }
}
