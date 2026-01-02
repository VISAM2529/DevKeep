import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import Community from "@/models/Community";
import Message from "@/models/Message";
import Task from "@/models/Task";
import mongoose from "mongoose";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const userId = new mongoose.Types.ObjectId(session.user.id);
        const userEmail = session.user.email?.toLowerCase();

        // 1. Get projects (owned or accepted collaborator)
        const projects = await Project.find({
            $or: [
                { userId: userId },
                { "sharedWith": { $elemMatch: { email: userEmail, accepted: true } } }
            ]
        }).select("_id name");

        const projectIds = projects.map(p => p._id);

        // 2. Get unread messages in projects
        const unreadProjectMessages = await Message.aggregate([
            {
                $match: {
                    projectId: { $in: projectIds },
                    "readBy.userId": { $ne: userId }
                }
            },
            {
                $group: {
                    _id: "$projectId",
                    count: { $sum: 1 }
                }
            }
        ]);

        // 3. Get assigned tasks in projects (not Done)
        const assignedTasks = await Task.aggregate([
            {
                $match: {
                    projectId: { $in: projectIds },
                    assigneeId: userId,
                    status: { $ne: "Done" }
                }
            },
            {
                $group: {
                    _id: "$projectId",
                    count: { $sum: 1 }
                }
            }
        ]);

        // 4. Get communities (owner or member)
        const communities = await Community.find({
            $or: [
                { ownerId: userId },
                { "members.userId": userId }
            ]
        }).select("_id name");

        const communityIds = communities.map(c => c._id);

        // 5. Get unread messages in communities
        const unreadCommunityMessages = await Message.aggregate([
            {
                $match: {
                    communityId: { $in: communityIds },
                    "readBy.userId": { $ne: userId }
                }
            },
            {
                $group: {
                    _id: "$communityId",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Format result
        const projectResults: Record<string, { messages: number; tasks: number; name: string }> = {};
        projects.forEach(p => {
            projectResults[p._id.toString()] = { messages: 0, tasks: 0, name: p.name };
        });

        unreadProjectMessages.forEach(item => {
            if (item._id && projectResults[item._id.toString()]) {
                projectResults[item._id.toString()].messages = item.count;
            }
        });

        assignedTasks.forEach(item => {
            if (item._id && projectResults[item._id.toString()]) {
                projectResults[item._id.toString()].tasks = item.count;
            }
        });

        const communityResults: Record<string, { messages: number; name: string }> = {};
        communities.forEach(c => {
            communityResults[c._id.toString()] = { messages: 0, name: c.name };
        });

        unreadCommunityMessages.forEach(item => {
            if (item._id && communityResults[item._id.toString()]) {
                communityResults[item._id.toString()].messages = item.count;
            }
        });

        const totalProjectsUnread = Object.values(projectResults).reduce((acc, curr) => acc + curr.messages + curr.tasks, 0);
        const totalCommunitiesUnread = Object.values(communityResults).reduce((acc, curr) => acc + curr.messages, 0);

        return NextResponse.json({
            totalProjectsUnread,
            totalCommunitiesUnread,
            projects: projectResults,
            communities: communityResults
        });

    } catch (error) {
        console.error("Unread notifications error:", error);
        return NextResponse.json({ error: "Failed to fetch unread notifications" }, { status: 500 });
    }
}
