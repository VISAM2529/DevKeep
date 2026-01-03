import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
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

        const { searchParams } = new URL(req.url);
        const hiddenQuery = searchParams.get("hidden");
        const isHiddenFilter = hiddenQuery === "true" ? true : { $ne: true };

        // 1. Accepted/Owned Communities
        const communities = await Community.find({
            $and: [
                { isHidden: isHiddenFilter },
                {
                    $or: [
                        { ownerId: session.user.id },
                        {
                            members: {
                                $elemMatch: {
                                    userId: session.user.id,
                                    accepted: { $ne: false } // Accepted or undefined (legacy)
                                }
                            }
                        }
                    ]
                }
            ]
        }).populate("ownerId", "name email").populate("members.userId", "name email image").sort({ createdAt: -1 });

        // 2. Pending Invitations
        const pendingInvitations = await Community.find({
            isHidden: isHiddenFilter,
            members: {
                $elemMatch: {
                    userId: session.user.id,
                    accepted: false
                }
            }
        }).populate("ownerId", "name email").sort({ createdAt: -1 });

        return NextResponse.json({ communities, pendingInvitations });
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

        const { name, description, icon, isHidden } = await req.json();

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
            isHidden: isHidden || false,
        });

        return NextResponse.json(newCommunity, { status: 201 });
    } catch (error: any) {
        console.error("POST /api/communities error:", error);
        return NextResponse.json({ error: error.message || "Failed to create community" }, { status: 500 });
    }
}

