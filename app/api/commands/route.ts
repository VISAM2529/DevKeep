import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Command from "@/models/Command";
import Project from "@/models/Project";
import { z } from "zod";

const commandSchema = z.object({
    projectId: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    command: z.string().min(1, "Command is required"),
    description: z.string().optional(),
    category: z.enum(["VSCode", "Git", "Docker", "NPM", "Server", "Other"]).optional(),
    tags: z.array(z.string()).optional(),
});

// GET /api/commands - List commands with filtering
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");
        const category = searchParams.get("category");
        const search = searchParams.get("search");
        const userEmail = session.user.email?.toLowerCase() || "";

        await connectDB();

        let query: any;
        const { getProjectAccessFilter, getProjectAccessLevel } = await import("@/lib/auth");

        if (projectId) {
            // Verify project access
            const { hasAccess } = await getProjectAccessLevel(projectId, session.user.id, userEmail);

            if (!hasAccess) {
                return NextResponse.json({ error: "Project access denied" }, { status: 403 });
            }
            query = { projectId };
        } else {
            // Get unified access filter for projects
            const accessFilter = await getProjectAccessFilter(session.user.id, userEmail);
            const accessibleProjects = await Project.find(accessFilter).select("_id");
            const projectIds = accessibleProjects.map((p: any) => p._id);

            query = {
                $or: [{ userId: session.user.id }, { projectId: { $in: projectIds } }],
            };
        }

        if (category) query.category = category;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { command: { $regex: search, $options: "i" } },
                { tags: { $in: [new RegExp(search, "i")] } },
            ];
        }

        const commands = await Command.find(query)
            .sort({ createdAt: -1 })
            .populate("projectId", "name");

        return NextResponse.json({ commands }, { status: 200 });
    } catch (error: any) {
        console.error("Get commands error:", error);
        return NextResponse.json(
            { error: "Failed to fetch commands" },
            { status: 500 }
        );
    }
}

// POST /api/commands - Create new command
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = commandSchema.parse(body);

        await connectDB();

        const command = await Command.create({
            ...validatedData,
            userId: session.user.id,
        });

        return NextResponse.json({ command }, { status: 201 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        console.error("Create command error:", error);
        return NextResponse.json(
            { error: "Failed to create command" },
            { status: 500 }
        );
    }
}
