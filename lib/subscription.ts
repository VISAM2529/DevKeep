// import User from "@/models/User";
// import { SUBSCRIPTION_PLANS } from "@/config/subscriptions";
// import connectDB from "@/lib/mongodb";
// import Project from "@/models/Project";
// import Community from "@/models/Community";

// export async function getUserSubscription(userId: string) {
//     await connectDB();
//     const user = await User.findById(userId);

//     if (!user) return null;

//     const plan = SUBSCRIPTION_PLANS.find((p) => p.slug === user.plan) || SUBSCRIPTION_PLANS[0]; // Default to basic if invalid

//     return {
//         plan,
//         razorpayCustomerId: user.razorpayCustomerId,
//         razorpaySubscriptionId: user.razorpaySubscriptionId,
//         status: user.subscriptionStatus,
//         endDate: user.subscriptionEndDate,
//     };
// }

// export async function checkLimit(userId: string, feature: "projects" | "communities") {
//     await connectDB();
//     const user = await User.findById(userId);

//     if (!user) return false;

//     // Trialing is considered Active for feature access
//     const isProOrPremium = user.plan === "pro" || user.plan === "premium";
//     const isActive = user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing";

//     // If active pro/premium, usually unlimited or high limits.
//     // But we should stick to config.
//     const planConfig = SUBSCRIPTION_PLANS.find((p) => p.slug === user.plan) || SUBSCRIPTION_PLANS[0];

//     // If plan limit is -1, it's unlimited
//     if (planConfig.limits[feature] === -1) {
//         return true;
//     }

//     let count = 0;

//     if (feature === "projects") {
//         count = await Project.countDocuments({ ownerId: userId });
//     } else if (feature === "communities") {
//         count = await Community.countDocuments({ ownerId: userId });
//     }

//     return count < planConfig.limits[feature];
// }


// /lib/subscription.ts
// /lib/subscription.ts

import mongoose from "mongoose";
import User from "@/models/User";
import { SUBSCRIPTION_PLANS } from "@/config/subscriptions";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import Community from "@/models/Community";

/**
 * Get full subscription details of user
 */
export async function getUserSubscription(userId: string) {
    await connectDB();

    const user = await User.findById(userId);
    if (!user) return null;

    const plan =
        SUBSCRIPTION_PLANS.find((p) => p.slug === user.plan) ||
        SUBSCRIPTION_PLANS[0]; // fallback to Basic

    return {
        plan,
        razorpayCustomerId: user.razorpayCustomerId,
        razorpaySubscriptionId: user.razorpaySubscriptionId,
        status: user.subscriptionStatus,
        endDate: user.subscriptionEndDate,
    };
}

/**
 * Check if user can create / receive more of a resource
 * Counts BOTH owned + shared items
 */
export async function checkLimit(
    userId: string,
    feature: "projects" | "communities",
    options: { forRecipient?: boolean } = {} // optional - future extension
) {
    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
        return {
            allowed: false,
            reason: "User not found",
            current: 0,
            limit: 0,
            remaining: 0,
            plan: "unknown",
            planName: "Unknown",
        };
    }

    // Determine effective plan (you can expand this later with status checks)
    let effectivePlanSlug = user.plan;

    // Optional: treat non-active/trialing subscriptions as basic
    if (
        user.subscriptionStatus &&
        !["active", "trialing"].includes(user.subscriptionStatus)
    ) {
        effectivePlanSlug = "basic";
    }

    const planConfig =
        SUBSCRIPTION_PLANS.find((p) => p.slug === effectivePlanSlug) ||
        SUBSCRIPTION_PLANS[0]; // fallback to Basic

    const limit = planConfig.limits[feature];

    // Support for future "unlimited" plans (-1)
    if (limit === -1) {
        return {
            allowed: true,
            remaining: Infinity,
            limit: -1,
            current: 0, // you can count real value if desired
            plan: effectivePlanSlug,
            planName: planConfig.name,
        };
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    let count = 0;

    if (feature === "projects") {
        // count owned or shared projects
        // shared projects store collaborator email, so include that
        const userEmail = user.email?.toLowerCase();
        const orClauses: any[] = [{ userId: userObjectId }];
        if (userEmail) {
            orClauses.push({ "sharedWith.email": userEmail });
        }

        count = await Project.countDocuments({
            $or: orClauses,
        });
    }

    if (feature === "communities") {
        // owned (ownerId) or where user is a member
        count = await Community.countDocuments({
            $or: [
                { ownerId: userObjectId },
                { "members.userId": userObjectId },
            ],
        });
    }

    const remaining = Math.max(0, limit - count);

    return {
        allowed: count < limit,
        remaining,
        limit,
        current: count,
        plan: effectivePlanSlug,
        planName: planConfig.name,
        reason: count >= limit
            ? `Limit reached (${count}/${limit}) on ${planConfig.name} plan`
            : undefined,
    };
}

/**
 * Optional helper: Get usage summary for dashboard
 */
export async function getUserUsage(userId: string) {
    const projectCheck = await checkLimit(userId, "projects");
    const communityCheck = await checkLimit(userId, "communities");

    return {
        projects: {
            current: projectCheck.current,
            limit: projectCheck.limit,
            remaining: projectCheck.remaining,
            allowed: projectCheck.allowed,
        },
        communities: {
            current: communityCheck.current,
            limit: communityCheck.limit,
            remaining: communityCheck.remaining,
            allowed: communityCheck.allowed,
        },
        planName: projectCheck.planName,
        planSlug: projectCheck.plan,
    };
}