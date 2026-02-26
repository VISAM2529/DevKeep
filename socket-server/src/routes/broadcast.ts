import { Router, Request, Response, NextFunction } from "express";
import { Server } from "socket.io";
import config from "../config";
import { sendNotification, NotificationPayload } from "../events/notification";
import { broadcastActivity, ActivityPayload } from "../events/activity";
import { ActivityType, NotificationType } from "../models";

/**
 * Internal Broadcast API — POST /internal/broadcast
 *
 * Protected by a shared secret header (x-internal-key).
 * Used by Next.js API routes to trigger socket events
 * without exposing the socket server publicly.
 */

interface BroadcastBody {
    type: "notification" | "activity" | "chat:new" | "custom";
    // Notification fields
    targetUserId?: string;
    notificationType?: NotificationType;
    title?: string;
    message?: string;
    link?: string;
    senderId?: string;
    projectId?: string;
    communityId?: string;
    // Activity fields
    actorId?: string;
    actorName?: string;
    actionType?: ActivityType;
    action?: string;
    details?: string;
    // Custom emit fields
    room?: string;
    event?: string;
    payload?: unknown;
}

export function createBroadcastRouter(io: Server): Router {
    const router = Router();

    // ── Shared-secret guard middleware ────────────────────────────────────────
    router.use((req: Request, res: Response, next: NextFunction) => {
        const key = req.headers["x-internal-key"];
        if (!key || key !== config.internalSocketKey) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        next();
    });

    // ── POST /internal/broadcast ──────────────────────────────────────────────
    router.post("/broadcast", async (req: Request, res: Response) => {
        const body = req.body as BroadcastBody;

        if (!body?.type) {
            res.status(400).json({ error: "type is required" });
            return;
        }

        try {
            switch (body.type) {
                // ── Notification ──────────────────────────────────────────────────
                case "notification": {
                    const { targetUserId, notificationType, title, message } = body;

                    if (!targetUserId || !notificationType || !title || !message) {
                        res.status(400).json({
                            error: "targetUserId, notificationType, title, message required",
                        });
                        return;
                    }

                    const notifPayload: NotificationPayload = {
                        recipientId: targetUserId,
                        type: notificationType,
                        title,
                        message,
                        link: body.link,
                        senderId: body.senderId,
                        projectId: body.projectId,
                        communityId: body.communityId,
                    };

                    await sendNotification(io, notifPayload);
                    res.json({ success: true, type: "notification" });
                    break;
                }

                // ── Activity ──────────────────────────────────────────────────────
                case "activity": {
                    const { projectId, actorId, actorName, actionType, action } = body;

                    if (!projectId || !actorId || !actorName || !actionType || !action) {
                        res.status(400).json({
                            error: "projectId, actorId, actorName, actionType, action required",
                        });
                        return;
                    }

                    const activityPayload: ActivityPayload = {
                        projectId,
                        actorId,
                        actorName,
                        actionType,
                        action,
                        details: body.details,
                    };

                    await broadcastActivity(io, activityPayload);
                    res.json({ success: true, type: "activity" });
                    break;
                }

                // ── Custom raw emit ───────────────────────────────────────────────
                case "custom": {
                    const { room, event, payload } = body;
                    if (!room || !event) {
                        res.status(400).json({ error: "room and event required" });
                        return;
                    }
                    io.to(room).emit(event, payload);
                    res.json({ success: true, type: "custom", room, event });
                    break;
                }

                // ── Direct chat:new push ──────────────────────────────────────────
                case "chat:new": {
                    const room = body.communityId
                        ? `community-${body.communityId}`
                        : body.projectId
                            ? `project-${body.projectId}`
                            : null;

                    if (!room || !body.payload) {
                        res.status(400).json({
                            error: "communityId or projectId and payload required",
                        });
                        return;
                    }
                    io.to(room).emit("chat:new", body.payload);
                    res.json({ success: true, type: "chat:new", room });
                    break;
                }

                default:
                    res.status(400).json({ error: `Unknown type: ${body.type}` });
            }
        } catch (err) {
            console.error("[BROADCAST] Error:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    return router;
}
