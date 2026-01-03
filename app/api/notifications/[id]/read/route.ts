import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";

// PATCH /api/notifications/[id]/read
export async function PATCH(
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

        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipientId: session.user.id },
            { $set: { read: true } },
            { new: true }
        );

        if (!notification) {
            return NextResponse.json({ error: "Notification not found" }, { status: 404 });
        }

        return NextResponse.json(notification);
    } catch (error) {
        console.error("Mark notification as read error:", error);
        return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 });
    }
}
