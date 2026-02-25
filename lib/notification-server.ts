import Notification from "@/models/Notification";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import { sendSocketNotification } from "@/lib/socket-server";

export interface CreateNotificationParams {
    recipientId: string | mongoose.Types.ObjectId;
    senderId?: string | mongoose.Types.ObjectId;
    type: "task_update" | "task_assigned" | "community_event" | "project_event" | "system" | "meeting_started" | "birthday_wish";
    title: string;
    message: string;
    link?: string;
    projectId?: string | mongoose.Types.ObjectId;
    communityId?: string | mongoose.Types.ObjectId;
}

/**
 * Creates a notification in the database and broadcasts it via WebSocket.
 */
export async function createNotification(params: CreateNotificationParams) {
    try {
        await connectDB();

        const notification = await Notification.create({
            ...params,
            recipientId: new mongoose.Types.ObjectId(params.recipientId),
            senderId: params.senderId ? new mongoose.Types.ObjectId(params.senderId) : undefined,
            projectId: params.projectId ? new mongoose.Types.ObjectId(params.projectId) : undefined,
            communityId: params.communityId ? new mongoose.Types.ObjectId(params.communityId) : undefined,
            read: false
        });

        console.log(`🔔 Notification created: ${notification._id} for user ${params.recipientId}`);

        // Broadcast via Socket Server
        await sendSocketNotification({
            targetUserId: params.recipientId.toString(),
            notificationType: params.type,
            title: params.title,
            message: params.message,
            link: params.link,
            senderId: params.senderId?.toString(),
            projectId: params.projectId?.toString(),
            communityId: params.communityId?.toString(),
        });

        return notification;
    } catch (error) {
        console.error("❌ Failed to create/broadcast notification:", error);
        throw error;
    }
}
