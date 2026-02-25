import { Server } from "socket.io";
import mongoose from "mongoose";
import { AuthenticatedSocket } from "../middleware/auth";
import { Activity, ActivityType } from "../models";

export interface ActivityPayload {
    projectId: string;
    actorId: string;
    actorName: string;
    actionType: ActivityType;
    action: string;       // Human-readable, e.g. "moved task 'Fix bug' to Done"
    details?: string;     // Optional machine-readable JSON string
}

/**
 * Persists an activity log entry and emits it to the project room.
 * Safe to call from both socket handlers and the internal broadcast route.
 */
export async function broadcastActivity(
    io: Server,
    payload: ActivityPayload
): Promise<void> {
    const { projectId, actorId, actorName, actionType, action, details } = payload;

    try {
        const doc = await Activity.create({
            projectId: new mongoose.Types.ObjectId(projectId),
            userId: new mongoose.Types.ObjectId(actorId),
            userName: actorName,
            type: actionType,
            action,
            details,
        });

        // Emit AFTER successful DB write
        io.to(`project-${projectId}`).emit("activity:new", {
            _id: doc._id.toString(),
            projectId: doc.projectId.toString(),
            actorId: doc.userId.toString(),
            actorName: doc.userName,
            actionType: doc.type,
            action: doc.action,
            details: doc.details,
            createdAt: doc.createdAt,
        });

        console.log(
            `[ACTIVITY] project-${projectId} ← ${actorName}: ${action}`
        );
    } catch (err) {
        console.error("[ACTIVITY] Failed to persist/emit activity:", err);
    }
}

/** Socket event handlers (clients can also trigger activity for optimistic cases) */
export function registerActivityHandlers(
    _io: Server,
    _socket: AuthenticatedSocket
): void {
    // Currently activity events are only triggered server-side (via API routes
    // or the internal broadcast endpoint). No direct client event needed yet.
    // This function is a hook for future expansion (e.g. typing indicators).
}
