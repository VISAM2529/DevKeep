import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Community from "@/models/Community";
import Message from "@/models/Message";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const community = await Community.findById(id)
            .populate("ownerId", "name email image")
            .populate("members.userId", "name email image");

        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        // Check if user has access
        const isMember = community.members.some(
            (m: any) => m.userId._id.toString() === session.user.id
        ) || community.ownerId._id.toString() === session.user.id;

        if (!isMember) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const unreadCount = await Message.countDocuments({
            communityId: id,
            "readBy.userId": { $ne: session.user.id }
        });

        return NextResponse.json({ ...community.toObject(), unreadCount });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch community" }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, description, icon } = await req.json();
        await connectDB();

        const community = await Community.findById(id);
        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        // Only admin/owner can update
        const isAdmin = community.members.some(
            (m: any) => m.userId.toString() === session.user.id && m.role === "admin"
        ) || community.ownerId.toString() === session.user.id;

        if (!isAdmin) {
            return NextResponse.json({ error: "Only admins can update community settings" }, { status: 403 });
        }

        community.name = name || community.name;
        community.description = description || community.description;
        community.icon = icon || community.icon;
        await community.save();

        return NextResponse.json(community);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update community" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const community = await Community.findById(id);
        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        if (community.ownerId.toString() !== session.user.id) {
            return NextResponse.json({ error: "Only the owner can delete a community" }, { status: 403 });
        }

        await community.deleteOne();

        return NextResponse.json({ message: "Community deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete community" }, { status: 500 });
    }
}
