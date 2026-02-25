import { Server } from "socket.io";
import mongoose from "mongoose";
import { AuthenticatedSocket } from "../middleware/auth";
import { Notification, NotificationType } from "../models";

export interface NotificationPayload {
    recipientId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    senderId?: string;
    projectId?: string;
    communityId?: string;
}

/**
 * Persists a notification to MongoDB and emits it in real-time.
 * Safe to call from socket handlers AND from the internal broadcast route.
 */
export async function sendNotification(
    io: Server,
    payload: NotificationPayload
): Promise<void> {
    const {
        recipientId,
        type,
        title,
        message,
        link,
        senderId,
        projectId,
        communityId,
    } = payload;

    // Never notify if actor === recipient (unless required)
    // (caller should strip self-notifications before calling this)

    try {
        const doc = await Notification.create({
            recipientId: new mongoose.Types.ObjectId(recipientId),
            senderId: senderId ? new mongoose.Types.ObjectId(senderId) : undefined,
            type,
            title,
            message,
            link,
            projectId: projectId ? new mongoose.Types.ObjectId(projectId) : undefined,
            communityId: communityId
                ? new mongoose.Types.ObjectId(communityId)
                : undefined,
            read: false,
        });

        // Emit AFTER successful DB write
        io.to(`user-${recipientId}`).emit("notification:new", {
            _id: doc._id.toString(),
            recipientId: doc.recipientId.toString(),
            senderId: doc.senderId?.toString(),
            type: doc.type,
            title: doc.title,
            message: doc.message,
            link: doc.link,
            projectId: doc.projectId?.toString(),
            communityId: doc.communityId?.toString(),
            read: doc.read,
            createdAt: doc.createdAt,
        });

        console.log(
            `[NOTIF] → user-${recipientId} type=${type}`
        );
    } catch (err) {
        console.error("[NOTIF] Failed to persist/emit notification:", err);
    }
}

/** Socket event handlers for notification interactions */
export function registerNotificationHandlers(
    io: Server,
    socket: AuthenticatedSocket
): void {
    const { id: userId } = socket.user;

    // Mark a single notification as read
    socket.on(
        "notification:read",
        async (payload: { notificationId: string }, ack: Function) => {
            const { notificationId } = payload || {};
            if (!notificationId) {
                ack?.({ success: false, error: "notificationId required" });
                return;
            }

            try {
                await Notification.findOneAndUpdate(
                    {
                        _id: new mongoose.Types.ObjectId(notificationId),
                        recipientId: new mongoose.Types.ObjectId(userId),
                    },
                    { read: true }
                );
                ack?.({ success: true });
            } catch (err) {
                ack?.({ success: false, error: "Failed to mark as read" });
            }
        }
    );

    // Mark ALL notifications as read
    socket.on("notification:read-all", async (_: unknown, ack: Function) => {
        try {
            await Notification.updateMany(
                { recipientId: new mongoose.Types.ObjectId(userId), read: false },
                { read: true }
            );
            ack?.({ success: true });
        } catch (err) {
            ack?.({ success: false, error: "Failed" });
        }
    });
}
