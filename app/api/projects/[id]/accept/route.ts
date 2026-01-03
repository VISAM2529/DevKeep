import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import mongoose from "mongoose";

// POST /api/projects/[id]/accept - Accept collaboration invitation
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const userEmail = session.user.email.toLowerCase();

        await connectDB();

        // Find project with pending invitation for this user
        const project = await Project.findOne({
            _id: id,
            "sharedWith": {
                $elemMatch: {
                    email: userEmail,
                    accepted: false
                }
            }
        });

        if (!project) {
            return NextResponse.json(
                { error: "No pending invitation found for this project" },
                { status: 404 }
            );
        }

        // Update the specific collaborator's accepted status
        const collaborator = project.sharedWith.find(s => s.email === userEmail);
        if (collaborator) {
            collaborator.accepted = true;
            project.markModified("sharedWith");
            await project.save();
        }

        return NextResponse.json(
            { message: "Invitation accepted successfully", project },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Accept invitation error:", error);
        return NextResponse.json(
            { error: "Failed to accept invitation" },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[id]/accept - Decline collaboration invitation
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const userEmail = session.user.email.toLowerCase();

        await connectDB();

        // Find and remove the pending invitation
        const project = await Project.findById(id);
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Remove the collaborator entry
        if (!project.sharedWith) project.sharedWith = [];
        project.sharedWith = project.sharedWith.filter(
            s => !(s.email === userEmail && !s.accepted)
        );

        project.markModified("sharedWith");
        await project.save();

        return NextResponse.json(
            { message: "Invitation declined successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Decline invitation error:", error);
        return NextResponse.json(
            { error: "Failed to decline invitation" },
            { status: 500 }
        );
    }
}
