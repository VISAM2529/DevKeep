import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Credential from "@/models/Credential";
import Project from "@/models/Project";
import { encrypt } from "@/lib/encryption";
import { z } from "zod";

const credentialSchema = z.object({
    projectId: z.string().optional(),
    platform: z.string().min(1, "Platform is required"),
    username: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    password: z.string().min(1, "Password is required"),
    notes: z.string().optional(),
});

// GET /api/credentials - List credentials (optionally filtered by projectId)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");

        await connectDB();

        let query: any;
        if (projectId) {
            // Verify project access
            const project = await Project.findOne({
                _id: projectId,
                $or: [
                    { userId: session.user.id },
                    { "sharedWith.email": session.user.email?.toLowerCase() }
                ]
            });

            if (!project) {
                return NextResponse.json({ error: "Project access denied" }, { status: 403 });
            }
            query = { projectId };
        } else {
            // Get accessible projects to find shared credentials
            const accessibleProjects = await Project.find({
                $or: [
                    { userId: session.user.id },
                    { "sharedWith.email": session.user.email?.toLowerCase() }
                ]
            }).select("_id");
            const projectIds = accessibleProjects.map((p: any) => p._id);

            query = {
                $or: [{ userId: session.user.id }, { projectId: { $in: projectIds } }],
            };
        }

        const credentials = await Credential.find(query)
            .sort({ createdAt: -1 })
            .populate("projectId", "name");

        // Don't send encrypted passwords in list view
        const sanitizedCredentials = credentials.map((cred) => ({
            ...cred.toObject(),
            password: "••••••••",
        }));

        return NextResponse.json({ credentials: sanitizedCredentials }, { status: 200 });
    } catch (error: any) {
        console.error("Get credentials error:", error);
        return NextResponse.json(
            { error: "Failed to fetch credentials" },
            { status: 500 }
        );
    }
}

// POST /api/credentials - Create new credential with encryption
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = credentialSchema.parse(body);

        await connectDB();

        // Encrypt password before saving
        const encryptedPassword = encrypt(validatedData.password);

        const credential = await Credential.create({
            ...validatedData,
            password: encryptedPassword,
            userId: session.user.id,
        });

        // Don't send encrypted password in response
        const response = {
            ...credential.toObject(),
            password: "••••••••",
        };

        return NextResponse.json({ credential: response }, { status: 201 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        console.error("Create credential error:", error);
        return NextResponse.json(
            { error: "Failed to create credential" },
            { status: 500 }
        );
    }
}
