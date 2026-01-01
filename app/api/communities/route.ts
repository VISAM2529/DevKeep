import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Community from "@/models/Community";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Find communities where user is owner or member
        const communities = await Community.find({
            $or: [
                { ownerId: session.user.id },
                { "members.userId": session.user.id }
            ]
        }).sort({ createdAt: -1 });

        return NextResponse.json(communities);
    } catch (error: any) {
        console.error("GET /api/communities error:", error);
        return NextResponse.json({ error: "Failed to fetch communities" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, description, icon } = await req.json();

        if (!name) {
            return NextResponse.json({ error: "Community name is required" }, { status: 400 });
        }

        await connectDB();

        const newCommunity = await Community.create({
            ownerId: session.user.id,
            name,
            description,
            icon,
            members: [
                {
                    userId: session.user.id,
                    role: "admin",
                },
            ],
        });

        return NextResponse.json(newCommunity, { status: 201 });
    } catch (error: any) {
        console.error("POST /api/communities error:", error);
        return NextResponse.json({ error: error.message || "Failed to create community" }, { status: 500 });
    }
}
