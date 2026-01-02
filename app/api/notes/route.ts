import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Note from "@/models/Note";
import Project from "@/models/Project";
import { z } from "zod";

const noteSchema = z.object({
    projectId: z.string().optional(),
    communityId: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    attachments: z.array(z.string()).optional(),
    isGlobal: z.boolean().optional(),
});

// GET /api/notes - List notes
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");
        const communityId = searchParams.get("communityId");
        const isGlobal = searchParams.get("isGlobal");
        const userEmail = session.user.email?.toLowerCase() || "";

        let query: any;
        const { getProjectAccessFilter, getProjectAccessLevel } = await import("@/lib/auth");

        if (projectId) {
            // Verify project access
            const { hasAccess } = await getProjectAccessLevel(projectId, session.user.id, userEmail);

            if (!hasAccess) {
                return NextResponse.json({ error: "Project access denied" }, { status: 403 });
            }
            query = { projectId };
        } else if (communityId) {
            // For now, allow community members to see notes. 
            // Ideally we should check if user is member of community.
            query = { communityId };
        } else {
            // Get unified access filter for projects
            const accessFilter = await getProjectAccessFilter(session.user.id, userEmail);
            const accessibleProjects = await Project.find(accessFilter).select("_id");
            const projectIds = accessibleProjects.map((p: any) => p._id);

            query = {
                $or: [
                    { userId: session.user.id },
                    { projectId: { $in: projectIds } },
                    { isGlobal: true }
                ]
            };
        }

        if (isGlobal !== null) query.isGlobal = isGlobal === "true";

        const notes = await Note.find(query)
            .sort({ createdAt: -1 })
            .populate("projectId", "name");

        return NextResponse.json({ notes }, { status: 200 });
    } catch (error: any) {
        console.error("Get notes error:", error);
        return NextResponse.json(
            { error: "Failed to fetch notes" },
            { status: 500 }
        );
    }
}

// POST /api/notes - Create new note
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = noteSchema.parse(body);

        await connectDB();

        // Handle global notes and project ID casting
        const noteData: any = {
            ...validatedData,
            userId: session.user.id,
        };

        if (noteData.projectId === "global" || noteData.projectId === "") {
            noteData.isGlobal = true;
            delete noteData.projectId;
        }

        // Ensure communityId is not empty string if passed
        if (noteData.communityId === "") {
            delete noteData.communityId;
        }

        const note = await Note.create(noteData);

        return NextResponse.json({ note }, { status: 201 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        console.error("Create note error:", error);
        return NextResponse.json(
            { error: "Failed to create note" },
            { status: 500 }
        );
    }
}
