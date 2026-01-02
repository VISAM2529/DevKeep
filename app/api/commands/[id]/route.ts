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

// GET /api/commands/[id] - Get single command
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

        const command = await Command.findById(id);

        if (!command) {
            return NextResponse.json({ error: "Command not found" }, { status: 404 });
        }

        // Check ownership or collaboration
        const isOwner = command.userId.toString() === session.user.id;
        let isCollaborator = false;

        if (!isOwner && command.projectId) {
            const project = await Project.findOne({
                _id: command.projectId,
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

        return NextResponse.json({ command }, { status: 200 });
    } catch (error: any) {
        console.error("Get command error:", error);
        return NextResponse.json(
            { error: "Failed to fetch command" },
            { status: 500 }
        );
    }
}

// PUT /api/commands/[id] - Update command
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
        const validatedData = commandSchema.partial().parse(body);

        await connectDB();

        const command = await Command.findById(id);
        if (!command) {
            return NextResponse.json({ error: "Command not found" }, { status: 404 });
        }

        // Check ownership or collaboration
        const isOwner = command.userId.toString() === session.user.id;
        let isCollaborator = false;

        if (!isOwner && command.projectId) {
            const project = await Project.findOne({
                _id: command.projectId,
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

        Object.assign(command, validatedData);
        await command.save();

        return NextResponse.json({ command }, { status: 200 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        console.error("Update command error:", error);
        return NextResponse.json(
            { error: "Failed to update command" },
            { status: 500 }
        );
    }
}

// DELETE /api/commands/[id] - Delete command
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

        const command = await Command.findById(id);
        if (!command) {
            return NextResponse.json({ error: "Command not found" }, { status: 404 });
        }

        // Check ownership or collaboration
        const isOwner = command.userId.toString() === session.user.id;
        let isCollaborator = false;

        if (!isOwner && command.projectId) {
            const project = await Project.findOne({
                _id: command.projectId,
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

        await Command.findByIdAndDelete(id);

        return NextResponse.json(
            { message: "Command deleted successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Delete command error:", error);
        return NextResponse.json(
            { error: "Failed to delete command" },
            { status: 500 }
        );
    }
}
