import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Community from "@/models/Community";
import User from "@/models/User";
import { z } from "zod";

const memberSchema = z.object({
    email: z.string().email("Invalid email address"),
    role: z.enum(["admin", "member"]).default("member"),
});

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { email, role } = memberSchema.parse(body);

        await connectDB();

        // 1. Verify community exists
        const community = await Community.findById(id);
        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        // 2. Verify requester permissions (must be admin or owner)
        const isRequesterAdmin = community.members.some(
            (m: any) => m.userId.toString() === session.user.id && m.role === "admin"
        ) || community.ownerId.toString() === session.user.id;

        if (!isRequesterAdmin) {
            return NextResponse.json({ error: "Only admins can add members" }, { status: 403 });
        }

        // 3. Find target user
        const targetUser = await User.findOne({ email: email.toLowerCase() });
        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 4. Check if already a member
        const isAlreadyMember = community.members.some(
            (m: any) => m.userId.toString() === targetUser._id.toString()
        ) || community.ownerId.toString() === targetUser._id.toString();

        if (isAlreadyMember) {
            return NextResponse.json({ error: "User is already a member" }, { status: 400 });
        }

        // 5. Add member
        community.members.push({
            userId: targetUser._id,
            role,
            joinedAt: new Date(),
        });

        await community.save();

        // Populate the new member for response
        // We can't easily populate just the pushed item, so we might return the whole list or just success
        // Ideally we fetch the updated community or find the user.
        // Let's populate the user details for the client to update UI
        const populatedCommunity = await Community.findById(id).populate("members.userId", "name email image");

        return NextResponse.json({
            message: "Member added successfully",
            members: populatedCommunity?.members
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error("Add member error:", error);
        return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
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

        const { searchParams } = new URL(req.url);
        const memberId = searchParams.get("memberId"); // This expects the User ID to remove

        if (!memberId) {
            return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
        }

        await connectDB();

        const community = await Community.findById(id);
        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        // Verify requester permissions (admin/owner) OR user leaving themselves
        const isRequesterAdmin = community.members.some(
            (m: any) => m.userId.toString() === session.user.id && m.role === "admin"
        ) || community.ownerId.toString() === session.user.id;

        const isSelfLeaving = memberId === session.user.id;

        if (!isRequesterAdmin && !isSelfLeaving) {
            return NextResponse.json({ error: "Permission denied" }, { status: 403 });
        }

        // Cannot remove the owner
        if (community.ownerId.toString() === memberId) {
            return NextResponse.json({ error: "Cannot remove the community owner" }, { status: 400 });
        }

        // Remove member
        community.members = community.members.filter(
            (m: any) => m.userId.toString() !== memberId
        );

        await community.save();

        return NextResponse.json({
            message: "Member removed successfully",
            members: community.members
        });

    } catch (error) {
        console.error("Remove member error:", error);
        return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { memberId, role } = body;

        if (!memberId || !role) {
            return NextResponse.json({ error: "Member ID and role are required" }, { status: 400 });
        }

        if (!["admin", "member"].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        await connectDB();

        const community = await Community.findById(id);
        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        // Verify requester permissions (admin/owner)
        const isRequesterAdmin = community.members.some(
            (m: any) => m.userId.toString() === session.user.id && m.role === "admin"
        ) || community.ownerId.toString() === session.user.id;

        if (!isRequesterAdmin) {
            return NextResponse.json({ error: "Only admins can change member roles" }, { status: 403 });
        }

        // Update member role
        const memberIndex = community.members.findIndex(
            (m: any) => m.userId.toString() === memberId
        );

        if (memberIndex === -1) {
            return NextResponse.json({ error: "Member not found in community" }, { status: 404 });
        }

        community.members[memberIndex].role = role;
        await community.save();

        const populatedCommunity = await Community.findById(id).populate("members.userId", "name email image");

        return NextResponse.json({
            message: "Role updated successfully",
            members: populatedCommunity?.members
        });

    } catch (error) {
        console.error("Update role error:", error);
        return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
    }
}
