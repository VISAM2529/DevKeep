import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import config from "./config";
import { authMiddleware, AuthenticatedSocket } from "./middleware/auth";
import { registerRoomHandlers } from "./rooms/roomManager";
import { registerChatHandlers } from "./events/chat";
import { registerNotificationHandlers } from "./events/notification";
import { registerActivityHandlers } from "./events/activity";

let _io: Server | null = null;

/** Returns the singleton Socket.io server instance */
export function getIO(): Server {
    if (!_io) throw new Error("Socket.io not initialised — call initSocket() first");
    return _io;
}

/** Initialises and attaches Socket.io to the HTTP server */
export function initSocket(httpServer: HttpServer): Server {
    const io = new Server(httpServer, {
        cors: {
            origin: [
                "http://localhost:3000",
                config.clientUrl,
            ].filter(Boolean),
            methods: ["GET", "POST"],
            credentials: true,
        },
        transports: ["websocket"],
        pingTimeout: 20000,
        pingInterval: 25000,
    });

    _io = io;

    // ── Auth middleware (runs before any connection event) ────────────────────
    io.use(authMiddleware);

    // ── Connection handler ────────────────────────────────────────────────────
    io.on("connection", (rawSocket) => {
        const socket = rawSocket as AuthenticatedSocket;
        const { id: userId, email } = socket.user;

        console.log(
            `[SOCKET] ✅  Connected  sid=${socket.id}  user=${userId} (${email})`
        );

        // Register all domain handlers
        registerRoomHandlers(io, socket);
        registerChatHandlers(io, socket);
        registerNotificationHandlers(io, socket);
        registerActivityHandlers(io, socket);

        // ── Graceful disconnect ───────────────────────────────────────────────
        socket.on("disconnect", (reason) => {
            console.log(
                `[SOCKET] ❌  Disconnected  sid=${socket.id}  user=${userId}  reason=${reason}`
            );
        });

        // ── Error handling ────────────────────────────────────────────────────
        socket.on("error", (err) => {
            console.error(`[SOCKET] Error  sid=${socket.id}:`, err.message);
        });
    });

    console.log("✅  Socket.io initialised");
    return io;
}
