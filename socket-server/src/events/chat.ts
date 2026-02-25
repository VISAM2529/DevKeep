import { Server } from "socket.io";
import mongoose from "mongoose";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { AuthenticatedSocket } from "../middleware/auth";
import { Community, Message, User } from "../models";

const chatRateLimiter = new RateLimiterMemory({
    points: 10,        // max 10 messages
    duration: 10,      // per 10 seconds per user
});

interface ChatSendPayload {
    communityId?: string;
    projectId?: string;
    content: string;
    meetingId?: string;
}

export function registerChatHandlers(io: Server, socket: AuthenticatedSocket): void {
    const { id: userId } = socket.user;

    socket.on("chat:send", async (payload: ChatSendPayload, ack: Function) => {
        // ── Rate limit ──────────────────────────────────────────────────────────
        try {
            await chatRateLimiter.consume(userId);
        } catch {
            ack?.({ success: false, error: "Rate limit exceeded. Slow down." });
            return;
        }

        // ── Validate payload ────────────────────────────────────────────────────
        const { communityId, projectId, content, meetingId } = payload || {};

        if (!content?.trim()) {
            ack?.({ success: false, error: "Message content is required" });
            return;
        }

        if (!communityId && !projectId) {
            ack?.({ success: false, error: "communityId or projectId required" });
            return;
        }

        // ── Authorise ───────────────────────────────────────────────────────────
        if (communityId) {
            const userObjId = new mongoose.Types.ObjectId(userId);
            const community = await Community.findById(communityId).lean();
            if (!community) {
                ack?.({ success: false, error: "Community not found" });
                return;
            }
            const isOwner = community.ownerId.toString() === userId;
            const isMember = (community.members as any[]).some(
                (m) => m.userId.toString() === userId && m.accepted === true
            );
            if (!isOwner && !isMember) {
                ack?.({ success: false, error: "Access denied" });
                return;
            }
        }

        // ── Persist to DB FIRST ─────────────────────────────────────────────────
        try {
            const senderObjId = new mongoose.Types.ObjectId(userId);

            const doc = await Message.create({
                communityId: communityId ? new mongoose.Types.ObjectId(communityId) : undefined,
                projectId: projectId ? new mongoose.Types.ObjectId(projectId) : undefined,
                meetingId: meetingId || undefined,
                senderId: senderObjId,
                content: content.trim(),
                readBy: [{ userId: senderObjId, readAt: new Date() }],
            });

            // Populate sender for the broadcast
            const sender = await User.findById(userId).lean();

            const broadcastMessage = {
                _id: doc._id.toString(),
                content: doc.content,
                senderId: {
                    _id: userId,
                    name: sender?.name || "Unknown",
                    image: sender?.image,
                },
                readBy: doc.readBy,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
                communityId: doc.communityId?.toString(),
                projectId: doc.projectId?.toString(),
                meetingId: doc.meetingId,
            };

            // ── Broadcast AFTER successful DB write ─────────────────────────────
            const room = communityId
                ? `community-${communityId}`
                : `project-${projectId}`;

            io.to(room).emit("chat:new", broadcastMessage);

            ack?.({ success: true, message: broadcastMessage });
            console.log(`[CHAT] ${userId} → ${room}: "${content.slice(0, 40)}"`);
        } catch (err) {
            console.error("[CHAT] Error saving message:", err);
            ack?.({ success: false, error: "Failed to send message" });
        }
    });

    // ── chat:mark-read ────────────────────────────────────────────────────────
    socket.on(
        "chat:mark-read",
        async (payload: { communityId?: string; projectId?: string }, ack: Function) => {
            const { communityId, projectId } = payload || {};
            if (!communityId && !projectId) return;

            await Message.updateMany(
                {
                    ...(communityId && { communityId }),
                    ...(projectId && { projectId }),
                    "readBy.userId": { $ne: new mongoose.Types.ObjectId(userId) },
                },
                {
                    $push: { readBy: { userId: new mongoose.Types.ObjectId(userId), readAt: new Date() } },
                }
            );

            ack?.({ success: true });
        }
    );
}
