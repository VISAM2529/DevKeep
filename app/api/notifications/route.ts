import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";

// GET /api/notifications
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const notifications = await Notification.find({ recipientId: session.user.id })
            .populate("senderId", "name image")
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json(notifications);
    } catch (error) {
        console.error("Fetch notifications error:", error);
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
}

// DELETE /api/notifications
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Delete all notifications for the user
        await Notification.deleteMany({ recipientId: session.user.id });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Clear notifications error:", error);
        return NextResponse.json({ error: "Failed to clear notifications" }, { status: 500 });
    }
}

