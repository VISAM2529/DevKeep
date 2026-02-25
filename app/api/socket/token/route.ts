import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/socket/token
 *
 * Returns the raw NextAuth JWT so the frontend SocketProvider
 * can pass it to the socket server's auth middleware.
 * The token is already httpOnly-cookie-protected on the Next.js side.
 */
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract the raw JWT from the cookie (same one NextAuth uses)
    const rawToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
        raw: true,
    });

    if (!rawToken) {
        return NextResponse.json({ error: "Token not found" }, { status: 401 });
    }

    return NextResponse.json({ token: rawToken });
}
