import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import Community from "@/models/Community";
import { encrypt, decrypt } from "@/lib/encryption";

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

        // Verify membership
        const community = await Community.findById(id);
        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        const isMember = community.members.some(
            (m: any) => m.userId.toString() === session.user.id
        ) || community.ownerId.toString() === session.user.id;

        if (!isMember) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const messages = await Message.find({ communityId: id })
            .populate("senderId", "name email image")
            .populate("readBy.userId", "name")
            .sort({ createdAt: 1 })
            .limit(100);

        // Decrypt messages
        const decryptedMessages = messages.map(msg => {
            const msgObj = msg.toObject();
            try {
                msgObj.content = decrypt(msgObj.content);
            } catch (err) {
                // If decryption fails, it might be an old plain-text message
            }
            return msgObj;
        });

        return NextResponse.json(decryptedMessages);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }
}

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

        const { content } = await req.json();
        if (!content) {
            return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
        }

        await connectDB();

        // Verify membership
        const community = await Community.findById(id);
        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        const isMember = community.members.some(
            (m: any) => m.userId.toString() === session.user.id
        ) || community.ownerId.toString() === session.user.id;

        if (!isMember) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Encrypt content
        const encryptedContent = encrypt(content);

        const message = await Message.create({
            communityId: id,
            senderId: session.user.id,
            content: encryptedContent,
        });

        // Populate sender info for immediate return
        await message.populate("senderId", "name email image");

        const responseMsg = message.toObject();
        responseMsg.content = content; // Return plain text to original sender

        return NextResponse.json(responseMsg, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}
