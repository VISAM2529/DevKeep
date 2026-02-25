import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import config from "../config";

/** Shape attached to every authenticated socket */
export interface AuthenticatedUser {
    id: string;
    email: string;
    name?: string;
}

/** Extended socket with typed user property */
export interface AuthenticatedSocket extends Socket {
    user: AuthenticatedUser;
}

/**
 * Socket.io middleware — runs before the `connection` event.
 * Verifies the NextAuth JWT and attaches `socket.user`.
 * Connection is rejected (error callback) if auth fails.
 */
export function authMiddleware(
    socket: Socket,
    next: (err?: Error) => void
): void {
    try {
        // Accept token from handshake.auth.token OR Authorization header
        const tokenFromAuth = (socket.handshake.auth as Record<string, string>)?.token;
        const authHeader = socket.handshake.headers?.authorization;
        const tokenFromHeader = authHeader?.startsWith("Bearer ")
            ? authHeader.slice(7)
            : undefined;

        const rawToken = tokenFromAuth || tokenFromHeader;

        if (!rawToken) {
            return next(new Error("UNAUTHORIZED: No token provided"));
        }

        // NextAuth JWTs are signed with NEXTAUTH_SECRET
        const decoded = jwt.verify(rawToken, config.nextAuthSecret) as jwt.JwtPayload;

        // NextAuth JWT stores userId as `sub` and email as `email`
        const userId = decoded.id || decoded.sub;
        const email = decoded.email;

        if (!userId || !email) {
            return next(new Error("UNAUTHORIZED: Invalid token payload"));
        }

        // Attach authenticated user — never trust client-sent userId
        (socket as AuthenticatedSocket).user = {
            id: String(userId),
            email: String(email),
            name: decoded.name as string | undefined,
        };

        next();
    } catch (err) {
        console.warn(`[AUTH] Rejected connection: ${(err as Error).message}`);
        next(new Error("UNAUTHORIZED: Token verification failed"));
    }
}
