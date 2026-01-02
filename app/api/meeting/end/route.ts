import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import Community from "@/models/Community";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId, communityId } = await req.json();

        await connectDB();

        if (projectId) {
            await Project.findByIdAndUpdate(projectId, { isMeetingActive: false });
        }
        else if (communityId) {
            await Community.findByIdAndUpdate(communityId, { isMeetingActive: false });
        }

        return NextResponse.json({ success: true, message: "Meeting ended" });
    } catch (error) {
        console.error("End meeting error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
