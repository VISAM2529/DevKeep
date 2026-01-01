import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import mongoose from "mongoose";
import { z } from "zod";

const projectSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
    techStack: z.array(z.string()).optional(),
    repositoryUrl: z.string().url().optional().or(z.literal("")),
    liveUrl: z.string().url().optional().or(z.literal("")),
    environment: z.enum(["Local", "Staging", "Production"]).optional(),
    status: z.enum(["Active", "Archived"]).optional(),
    logo: z.string().optional(),
    banner: z.string().optional(),
    communityId: z.string().optional(),
});

// GET /api/projects - List all projects for authenticated user
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const environment = searchParams.get("environment");
        const communityId = searchParams.get("communityId");
        const userEmail = session.user.email?.toLowerCase();

        // Build base query filters
        const filters: any = {};
        if (status) filters.status = status;
        if (environment) filters.environment = environment;
        if (communityId) filters.communityId = communityId;

        // 1. Owned projects
        const ownedProjects = await Project.find({
            userId: new mongoose.Types.ObjectId(session.user.id),
            ...filters
        })
            .populate("userId", "email name")
            .sort({ createdAt: -1 });

        // 2. Accepted shared projects
        const sharedProjects = await Project.find({
            "sharedWith": {
                $elemMatch: {
                    email: userEmail,
                    accepted: true
                }
            },
            ...filters
        })
            .populate("userId", "email name")
            .sort({ createdAt: -1 });

        // 3. Pending invitations
        const pendingInvitations = await Project.find({
            "sharedWith": {
                $elemMatch: {
                    email: userEmail,
                    accepted: false
                }
            },
            ...filters
        })
            .populate("userId", "email name")
            .sort({ createdAt: -1 });

        return NextResponse.json({
            ownedProjects,
            sharedProjects,
            pendingInvitations,
            // For backward compatibility, combine owned and shared
            projects: [...ownedProjects, ...sharedProjects]
        }, { status: 200 });
    } catch (error: any) {
        console.error("Get projects error:", error);
        return NextResponse.json(
            { error: "Failed to fetch projects" },
            { status: 500 }
        );
    }
}

// POST /api/projects - Create new project
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = projectSchema.parse(body);

        await connectDB();

        const project = await Project.create({
            ...validatedData,
            userId: session.user.id,
        });

        return NextResponse.json({ project }, { status: 201 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        console.error("Create project error:", error);
        return NextResponse.json(
            { error: "Failed to create project" },
            { status: 500 }
        );
    }
}
