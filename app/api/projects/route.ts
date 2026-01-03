import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
    isHidden: z.boolean().optional(),
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
        const communityIdQuery = searchParams.get("communityId");
        const hiddenQuery = searchParams.get("hidden");
        const userEmail = session.user.email?.toLowerCase() || "";

        // Build base query filters
        const filters: any = {};
        if (status) filters.status = status;
        if (environment) filters.environment = environment;
        if (communityIdQuery) filters.communityId = communityIdQuery;

        // Hidden Space Logic
        // If hidden=true, show ONLY hidden projects
        // If hidden!=true (default), show ONLY visible projects (false or undefined)
        if (hiddenQuery === "true") {
            filters.isHidden = true;
        } else {
            filters.isHidden = { $ne: true };
        }

        // Get unified access filter
        const { getProjectAccessFilter } = await import("@/lib/auth");
        const accessFilter = await getProjectAccessFilter(session.user.id, userEmail);

        // 1. All accessible projects (Owned, Shared, Inherited)
        const allAccessibleProjects = await Project.find({
            ...accessFilter,
            ...filters
        })
            .populate("userId", "email name")
            .sort({ createdAt: -1 });

        // Split for frontend categorization if needed, though they can be combined
        const ownedProjects = allAccessibleProjects.filter(p => p.userId._id.toString() === session.user.id);
        const sharedProjects = allAccessibleProjects.filter(p => p.userId._id.toString() !== session.user.id);

        // 3. Pending invitations (Still need explicit query as they aren't "accessible" yet)
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
            projects: allAccessibleProjects
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

        // 1. If community member, verify admin/owner status
        if (validatedData.communityId) {
            const Community = (await import("@/models/Community")).default;
            const community = await Community.findById(validatedData.communityId);
            if (!community) {
                return NextResponse.json({ error: "Community not found" }, { status: 404 });
            }

            const isCommunityAdmin = community.members.some(
                (m: any) => m.userId.toString() === session.user.id && m.role === "admin"
            ) || community.ownerId.toString() === session.user.id;

            if (!isCommunityAdmin) {
                return NextResponse.json({ error: "Only community admins can create projects in this community" }, { status: 403 });
            }
        }

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

