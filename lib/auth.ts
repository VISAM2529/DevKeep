import mongoose from "mongoose";
import Community from "@/models/Community";

/**
 * Generates a MongoDB query for projects that a user has access to.
 * Includes owned projects, explicitly shared projects (accepted),
 * and projects belonging to communities where the user is an owner or admin.
 */
export async function getProjectAccessFilter(userId: string, userEmail: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const lowercaseEmail = userEmail.toLowerCase();

    // 1. Find all communities where user is owner or admin
    const adminCommunities = await Community.find({
        $or: [
            { ownerId: userObjectId },
            { "members": { $elemMatch: { userId: userObjectId, role: "admin" } } }
        ]
    }).select("_id");

    const communityIds = adminCommunities.map(c => c._id);

    // 2. Build the $or query for Projects
    return {
        $or: [
            { userId: userObjectId }, // Owned
            { "sharedWith": { $elemMatch: { email: lowercaseEmail, accepted: true } } }, // Shared
            { communityId: { $in: communityIds } } // Inherited via Community Admin
        ]
    };
}

/**
 * Checks if a user has access to a specific project and returns the access level.
 */
export async function getProjectAccessLevel(projectId: string | mongoose.Types.ObjectId, userId: string, userEmail: string) {
    const Project = (await import("@/models/Project")).default;
    const project = await Project.findById(projectId);

    if (!project) return { hasAccess: false, role: null };

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const lowercaseEmail = userEmail.toLowerCase();

    // 1. Check Owner
    if (project.userId.toString() === userId) {
        return { hasAccess: true, role: "Owner" };
    }

    // 2. Check Community Admin/Owner
    if (project.communityId) {
        const community = await Community.findById(project.communityId);
        if (community) {
            const isCommunityAdmin = community.ownerId.toString() === userId ||
                community.members.some((m: any) => m.userId.toString() === userId && m.role === "admin");

            if (isCommunityAdmin) {
                return { hasAccess: true, role: "Community Admin" };
            }
        }
    }

    // 3. Check Explicit Collaboration
    const collab = project.sharedWith.find((c: any) => c.email === lowercaseEmail && c.accepted === true);
    if (collab) {
        return { hasAccess: true, role: collab.role };
    }

    return { hasAccess: false, role: null };
}
