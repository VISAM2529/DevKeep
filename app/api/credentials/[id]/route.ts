import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Credential from "@/models/Credential";
import Project from "@/models/Project";
import { encrypt, decrypt } from "@/lib/encryption";
import { z } from "zod";

const credentialSchema = z.object({
    projectId: z.string().optional(),
    platform: z.string().min(1, "Platform is required"),
    username: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    password: z.string().min(1, "Password is required"),
    notes: z.string().optional(),
});

// GET /api/credentials/[id] - Get credential with decrypted password
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await connectDB();

        const credential = await Credential.findById(id);

        if (!credential) {
            return NextResponse.json({ error: "Credential not found" }, { status: 404 });
        }

        // Check ownership
        const isOwner = credential.userId.toString() === session.user.id;
        let isCollaborator = false;

        if (!isOwner && credential.projectId) {
            // Check project collaboration or ownership
            const project = await Project.findOne({
                _id: credential.projectId,
                $or: [
                    { userId: session.user.id },
                    {
                        "sharedWith": {
                            $elemMatch: {
                                email: session.user.email?.toLowerCase(),
                                accepted: true
                            }
                        }
                    }
                ]
            });
            if (project) isCollaborator = true;
        }

        if (!isOwner && !isCollaborator) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Decrypt password for viewing
        const decryptedPassword = decrypt(credential.password);

        const response = {
            ...credential.toObject(),
            password: decryptedPassword,
        };

        return NextResponse.json({ credential: response }, { status: 200 });
    } catch (error: any) {
        console.error("Get credential error:", error);
        return NextResponse.json(
            { error: "Failed to fetch credential" },
            { status: 500 }
        );
    }
}

// PUT /api/credentials/[id] - Update credential
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const validatedData = credentialSchema.partial().parse(body);

        await connectDB();

        const credential = await Credential.findById(id);
        if (!credential) {
            return NextResponse.json({ error: "Credential not found" }, { status: 404 });
        }

        // Check ownership or collaboration
        const isOwner = credential.userId.toString() === session.user.id;
        let isCollaborator = false;

        if (!isOwner && credential.projectId) {
            const project = await Project.findOne({
                _id: credential.projectId,
                $or: [
                    { userId: session.user.id },
                    {
                        "sharedWith": {
                            $elemMatch: {
                                email: session.user.email?.toLowerCase(),
                                accepted: true
                            }
                        }
                    }
                ]
            });
            if (project) isCollaborator = true;
        }

        if (!isOwner && !isCollaborator) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // If password is being updated, encrypt it
        if (validatedData.password) {
            validatedData.password = encrypt(validatedData.password);
        }

        Object.assign(credential, validatedData);
        await credential.save();

        // Don't send encrypted password in response
        const response = {
            ...credential.toObject(),
            password: "••••••••",
        };

        return NextResponse.json({ credential: response }, { status: 200 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        console.error("Update credential error:", error);
        return NextResponse.json(
            { error: "Failed to update credential" },
            { status: 500 }
        );
    }
}

// DELETE /api/credentials/[id] - Delete credential
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await connectDB();

        const credential = await Credential.findById(id);
        if (!credential) {
            return NextResponse.json({ error: "Credential not found" }, { status: 404 });
        }

        // Check ownership or collaboration
        const isOwner = credential.userId.toString() === session.user.id;
        let isCollaborator = false;

        if (!isOwner && credential.projectId) {
            const project = await Project.findOne({
                _id: credential.projectId,
                $or: [
                    { userId: session.user.id },
                    {
                        "sharedWith": {
                            $elemMatch: {
                                email: session.user.email?.toLowerCase(),
                                accepted: true
                            }
                        }
                    }
                ]
            });
            if (project) isCollaborator = true;
        }

        if (!isOwner && !isCollaborator) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        await Credential.findByIdAndDelete(id);

        return NextResponse.json(
            { message: "Credential deleted successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Delete credential error:", error);
        return NextResponse.json(
            { error: "Failed to delete credential" },
            { status: 500 }
        );
    }
}
