import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Note from "@/models/Note";
import Project from "@/models/Project";
import { z } from "zod";

const noteSchema = z.object({
    projectId: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    attachments: z.array(z.string()).optional(),
    isGlobal: z.boolean().optional(),
});

// GET /api/notes/[id] - Get single note
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

        const note = await Note.findById(id);

        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        // Check ownership or collaboration
        const isOwner = note.userId.toString() === session.user.id;
        let hasProjectAccessFlag = false;

        if (!isOwner && note.projectId) {
            const { getProjectAccessLevel } = await import("@/lib/auth");
            const { hasAccess } = await getProjectAccessLevel(note.projectId.toString(), session.user.id, session.user.email?.toLowerCase() || "");
            if (hasAccess) hasProjectAccessFlag = true;
        }

        if (!isOwner && !hasProjectAccessFlag && !note.isGlobal) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        return NextResponse.json({ note }, { status: 200 });
    } catch (error: any) {
        console.error("Get note error:", error);
        return NextResponse.json(
            { error: "Failed to fetch note" },
            { status: 500 }
        );
    }
}

// PUT /api/notes/[id] - Update note
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
        const validatedData = noteSchema.partial().parse(body);

        await connectDB();

        const note = await Note.findById(id);
        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        // Check ownership or collaboration
        const isOwner = note.userId.toString() === session.user.id;
        let hasProjectAccessFlag = false;

        if (!isOwner && note.projectId) {
            const { getProjectAccessLevel } = await import("@/lib/auth");
            const { hasAccess } = await getProjectAccessLevel(note.projectId.toString(), session.user.id, session.user.email?.toLowerCase() || "");
            if (hasAccess) hasProjectAccessFlag = true;
        }

        if (!isOwner && !hasProjectAccessFlag) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Explicitly handle attachments if provided
        if (body.attachments) {
            note.attachments = body.attachments;
        }

        Object.assign(note, validatedData);
        await note.save();

        return NextResponse.json({ note }, { status: 200 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        console.error("Update note error:", error);
        return NextResponse.json(
            { error: "Failed to update note" },
            { status: 500 }
        );
    }
}

// DELETE /api/notes/[id] - Delete note
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

        const note = await Note.findById(id);
        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        // Check ownership or collaboration
        const isOwner = note.userId.toString() === session.user.id;
        let hasProjectAccessFlag = false;

        if (!isOwner && note.projectId) {
            const { getProjectAccessLevel } = await import("@/lib/auth");
            const { hasAccess } = await getProjectAccessLevel(note.projectId.toString(), session.user.id, session.user.email?.toLowerCase() || "");
            if (hasAccess) hasProjectAccessFlag = true;
        }

        if (!isOwner && !hasProjectAccessFlag) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        await Note.findByIdAndDelete(id);

        return NextResponse.json(
            { message: "Note deleted successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Delete note error:", error);
        return NextResponse.json(
            { error: "Failed to delete note" },
            { status: 500 }
        );
    }
}
