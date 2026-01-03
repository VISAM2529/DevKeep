import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import Community from "@/models/Community";
import Message from "@/models/Message";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId, communityId } = await req.json();

        await connectDB();

        if (projectId) {
            const project = await Project.findById(projectId);
            if ((project as any)?.activeMeetingId) {
                // Delete chat history for this meeting
                await Message.deleteMany({ meetingId: (project as any).activeMeetingId });
            }
            await Project.findByIdAndUpdate(projectId, {
                isMeetingActive: false,
                $unset: { activeMeetingId: "" }
            });
        }
        else if (communityId) {
            const community = await Community.findById(communityId);
            if ((community as any)?.activeMeetingId) {
                await Message.deleteMany({ meetingId: (community as any).activeMeetingId });
            }
            await Community.findByIdAndUpdate(communityId, {
                isMeetingActive: false,
                $unset: { activeMeetingId: "" }
            });
        }

        return NextResponse.json({ success: true, message: "Meeting ended" });
    } catch (error) {
        console.error("End meeting error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

