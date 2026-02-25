/**
 * Socket Server Internal API Client
 * 
 * This utility allows Next.js API routes to trigger real-time events on the 
 * dedicated socket server using a shared secret key.
 */

const SOCKET_SERVER_INTERNAL_URL = process.env.SOCKET_SERVER_INTERNAL_URL || "http://localhost:3002/internal";
const INTERNAL_SOCKET_KEY = process.env.INTERNAL_SOCKET_KEY;

type BroadcastType = "notification" | "activity" | "chat:new" | "custom";

interface BroadcastPayload {
    type: BroadcastType;
    [key: string]: any;
}

export async function broadcastToSocket(payload: BroadcastPayload) {
    if (!INTERNAL_SOCKET_KEY) {
        console.warn("[SOCKET_CLIENT] INTERNAL_SOCKET_KEY not set. Skipping broadcast.");
        return;
    }

    try {
        const response = await fetch(`${SOCKET_SERVER_INTERNAL_URL}/broadcast`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-internal-key": INTERNAL_SOCKET_KEY,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("[SOCKET_CLIENT] Broadcast failed:", error);
            return { success: false, error };
        }

        return await response.json();
    } catch (err) {
        console.error("[SOCKET_CLIENT] Connection error:", err);
        return { success: false, error: err };
    }
}

/** Helper to send a notification via socket server */
export async function sendSocketNotification(params: {
    targetUserId: string;
    notificationType: string;
    title: string;
    message: string;
    link?: string;
    senderId?: string;
    projectId?: string;
    communityId?: string;
}) {
    return broadcastToSocket({
        type: "notification",
        ...params
    });
}

/** Helper to broadcast activity via socket server */
export async function broadcastSocketActivity(params: {
    projectId: string;
    actorId: string;
    actorName: string;
    actionType: string;
    action: string;
    details?: string;
}) {
    return broadcastToSocket({
        type: "activity",
        ...params
    });
}
