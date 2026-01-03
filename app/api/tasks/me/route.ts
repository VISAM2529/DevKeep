import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

// GET /api/tasks/me
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Find tasks assigned to current user
        const tasks = await Task.find({ assigneeId: session.user.id })
            .populate("projectId", "name")
            .populate("creatorId", "name")
            .sort({ deadline: 1, createdAt: -1 });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Fetch my tasks error:", error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}

