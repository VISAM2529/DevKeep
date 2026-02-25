"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

interface SocketContextValue {
    socket: Socket | null;
    connectionState: ConnectionState;
    joinCommunityRoom: (communityId: string) => void;
    joinProjectRoom: (projectId: string) => void;
    leaveRoom: (room: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SocketContext = createContext<SocketContextValue>({
    socket: null,
    connectionState: "disconnected",
    joinCommunityRoom: () => { },
    joinProjectRoom: () => { },
    leaveRoom: () => { },
});

// ─── Provider ─────────────────────────────────────────────────────────────────

const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3002";

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const socketRef = useRef<Socket | null>(null);
    const [connectionState, setConnectionState] =
        useState<ConnectionState>("disconnected");
    const [socketToken, setSocketToken] = useState<string | null>(null);

    // Keep the active rooms so we can re-join after reconnect
    const activeRoomsRef = useRef<
        { type: "community" | "project"; id: string }[]
    >([]);

    const rejoinRooms = useCallback((socket: Socket) => {
        activeRoomsRef.current.forEach(({ type, id }) => {
            if (type === "community") {
                socket.emit("room:join-community", { type: "community", resourceId: id });
            } else {
                socket.emit("room:join-project", { type: "project", resourceId: id });
            }
        });
    }, []);

    // ── Fetch Socket Token ───────────────────────────────────────────────────
    useEffect(() => {
        if (status === "authenticated" && !socketToken) {
            fetch("/api/socket/token")
                .then(res => res.json())
                .then(data => {
                    if (data.token) setSocketToken(data.token);
                })
                .catch(err => console.error("[SOCKET] Token fetch failed", err));
        }
    }, [status, socketToken]);

    useEffect(() => {
        // Only connect when the session and token are available
        if (status !== "authenticated" || !session?.user?.id || !socketToken) return;

        // Avoid duplicate connections across React StrictMode double-invocations
        if (socketRef.current?.connected) return;

        const socket = io(SOCKET_URL, {
            auth: {
                token: socketToken,
            },
            transports: ["websocket"],
            withCredentials: true,
            autoConnect: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 30_000,
            randomizationFactor: 0.5,
        });

        socketRef.current = socket;
        setConnectionState("connecting");

        socket.on("connect", () => {
            console.log("[SOCKET] Connected:", socket.id);
            setConnectionState("connected");
            // Re-join rooms after reconnect
            rejoinRooms(socket);
        });

        socket.on("disconnect", (reason) => {
            console.warn("[SOCKET] Disconnected:", reason);
            setConnectionState("disconnected");
        });

        socket.on("connect_error", (err) => {
            console.error("[SOCKET] Connection error:", err.message);
            setConnectionState("error");
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setConnectionState("disconnected");
        };
    }, [session?.user?.id, status, rejoinRooms]);

    // ── Room helpers ────────────────────────────────────────────────────────────

    const joinCommunityRoom = useCallback((communityId: string) => {
        const socket = socketRef.current;
        if (!socket?.connected) return;

        socket.emit(
            "room:join-community",
            { type: "community", resourceId: communityId },
            (res: { success: boolean }) => {
                if (res?.success) {
                    activeRoomsRef.current = [
                        ...activeRoomsRef.current.filter((r) => !(r.type === "community" && r.id === communityId)),
                        { type: "community", id: communityId },
                    ];
                }
            }
        );
    }, []);

    const joinProjectRoom = useCallback((projectId: string) => {
        const socket = socketRef.current;
        if (!socket?.connected) return;

        socket.emit(
            "room:join-project",
            { type: "project", resourceId: projectId },
            (res: { success: boolean }) => {
                if (res?.success) {
                    activeRoomsRef.current = [
                        ...activeRoomsRef.current.filter((r) => !(r.type === "project" && r.id === projectId)),
                        { type: "project", id: projectId },
                    ];
                }
            }
        );
    }, []);

    const leaveRoom = useCallback((room: string) => {
        const socket = socketRef.current;
        if (!socket?.connected) return;

        socket.emit("room:leave", { room });
        activeRoomsRef.current = activeRoomsRef.current.filter(
            (r) => `${r.type}-${r.id}` !== room
        );
    }, []);

    return (
        <SocketContext.Provider
            value={{
                socket: socketRef.current,
                connectionState,
                joinCommunityRoom,
                joinProjectRoom,
                leaveRoom,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSocket(): SocketContextValue {
    return useContext(SocketContext);
}
