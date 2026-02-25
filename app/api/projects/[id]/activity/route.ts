import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getProjectAccessLevel } from "@/lib/auth";
import Activity from "@/models/Activity";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        const { hasAccess, role } = await getProjectAccessLevel(id, session.user.id, session.user.email!);

        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const searchParams = req.nextUrl.searchParams;
        const filter = searchParams.get("filter") || "ALL"; // ALL | TEAM | MY

        // Ensure models are registered for populate
        const User = (await import("@/models/User")).default;

        let query: any = {
            projectId: new mongoose.Types.ObjectId(id)
        };

        // Role-based visibility enforcement
        const isAdmin = role === "Owner" || role === "Admin" || role === "Project Lead" || role === "Community Admin";

        if (!isAdmin) {
            // Force "MY" filter for non-admin members
            query.userId = new mongoose.Types.ObjectId(session.user.id);
        } else {
            // Admin/Owner filtering
            if (filter === "MY") {
                query.userId = new mongoose.Types.ObjectId(session.user.id);
            } else if (filter === "TEAM") {
                query.userId = { $ne: new mongoose.Types.ObjectId(session.user.id) };
            }
            // "ALL" doesn't need extra userId filter
        }

        const activities = await Activity.find(query)
            .populate("userId", "image name")
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json(activities);
    } catch (error: any) {
        console.error("Fetch Activity Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
