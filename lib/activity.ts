import Activity from "@/models/Activity";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import { broadcastSocketActivity } from "@/lib/socket-server";

export async function logActivity({
    projectId,
    userId,
    userName,
    action,
    type,
    details
}: {
    projectId: string;
    userId: string;
    userName: string;
    action: string;
    type: "task" | "command" | "credential" | "note" | "member" | "system";
    details?: string;
}) {
    try {
        console.log(`📝 Attempting to log activity: ${action} for project ${projectId} by ${userName}`);
        await connectDB();
        const activity = await Activity.create({
            projectId: new mongoose.Types.ObjectId(projectId),
            userId: new mongoose.Types.ObjectId(userId),
            userName,
            action,
            type,
            details
        });
        console.log(`✅ Activity logged successfully: ${activity._id}`);

        // Broadcast to socket server
        await broadcastSocketActivity({
            projectId,
            actorId: userId,
            actorName: userName,
            actionType: type,
            action,
            details
        });

    } catch (error) {
        console.error("❌ Failed to log activity:", error);
    }
}
