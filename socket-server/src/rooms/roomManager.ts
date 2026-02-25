import { Server } from "socket.io";
import mongoose from "mongoose";
import { AuthenticatedSocket } from "../middleware/auth";
import { Community, Project } from "../models";

/**
 * Room naming conventions:
 *   user-{userId}           — private user room (joined on connect)
 *   community-{communityId} — community chat / events
 *   project-{projectId}     — project events / activity feed
 */

export type RoomType = "community" | "project";

interface JoinPayload {
    type: RoomType;
    resourceId: string;
}

/** Verify user is a member/owner of a community */
async function canJoinCommunity(
    userId: string,
    communityId: string
): Promise<boolean> {
    try {
        const userObjId = new mongoose.Types.ObjectId(userId);
        const community = await Community.findById(communityId).lean();
        if (!community) return false;

        const isOwner = community.ownerId.toString() === userId;
        const isMember = community.members.some(
            (m: any) => m.userId.toString() === userId && m.accepted === true
        );
        return isOwner || isMember;
    } catch {
        return false;
    }
}

/** Verify user has access to a project (owner, shared, or community admin) */
async function canJoinProject(userId: string, projectId: string): Promise<boolean> {
    try {
        const project = await Project.findById(projectId).lean();
        if (!project) return false;

        // Owner
        if (project.userId.toString() === userId) return true;

        // Shared collaborator
        const userDoc = await import("../models").then((m) =>
            m.User.findById(userId).lean()
        );
        if (!userDoc) return false;

        const isShared = project.sharedWith?.some(
            (s: any) => s.email === (userDoc as any).email && s.accepted === true
        );
        if (isShared) return true;

        // Community admin
        if (project.communityId) {
            const community = await Community.findById(project.communityId).lean();
            if (community) {
                const isAdmin =
                    community.ownerId.toString() === userId ||
                    community.members.some(
                        (m: any) =>
                            m.userId.toString() === userId && m.role === "admin" && m.accepted === true
                    );
                if (isAdmin) return true;
            }
        }

        return false;
    } catch {
        return false;
    }
}

export function registerRoomHandlers(io: Server, socket: AuthenticatedSocket): void {
    const { id: userId } = socket.user;

    // ── Join personal user room instantly on connect ──────────────────────────
    socket.join(`user-${userId}`);
    console.log(`[ROOM] ${socket.id} joined user-${userId}`);

    // ── room:join-community ───────────────────────────────────────────────────
    socket.on("room:join-community", async (payload: JoinPayload, ack: Function) => {
        const { resourceId: communityId } = payload || {};

        if (!communityId) {
            ack?.({ success: false, error: "communityId required" });
            return;
        }

        const allowed = await canJoinCommunity(userId, communityId);
        if (!allowed) {
            ack?.({ success: false, error: "Access denied" });
            socket.emit("error", { message: "Access denied to community room" });
            return;
        }

        socket.join(`community-${communityId}`);
        ack?.({ success: true, room: `community-${communityId}` });
        console.log(`[ROOM] ${socket.id} (user ${userId}) joined community-${communityId}`);
    });

    // ── room:join-project ─────────────────────────────────────────────────────
    socket.on("room:join-project", async (payload: JoinPayload, ack: Function) => {
        const { resourceId: projectId } = payload || {};

        if (!projectId) {
            ack?.({ success: false, error: "projectId required" });
            return;
        }

        const allowed = await canJoinProject(userId, projectId);
        if (!allowed) {
            ack?.({ success: false, error: "Access denied" });
            socket.emit("error", { message: "Access denied to project room" });
            return;
        }

        socket.join(`project-${projectId}`);
        ack?.({ success: true, room: `project-${projectId}` });
        console.log(`[ROOM] ${socket.id} (user ${userId}) joined project-${projectId}`);
    });

    // ── room:leave ────────────────────────────────────────────────────────────
    socket.on("room:leave", (payload: { room: string }, ack: Function) => {
        const { room } = payload || {};
        if (!room) {
            ack?.({ success: false, error: "room required" });
            return;
        }
        // Prevent leaving private user room
        if (room === `user-${userId}`) {
            ack?.({ success: false, error: "Cannot leave personal room" });
            return;
        }
        socket.leave(room);
        ack?.({ success: true });
        console.log(`[ROOM] ${socket.id} left ${room}`);
    });
}
