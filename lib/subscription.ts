import User from "@/models/User";
import { SUBSCRIPTION_PLANS } from "@/config/subscriptions";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import Community from "@/models/Community";

export async function getUserSubscription(userId: string) {
    await connectDB();
    const user = await User.findById(userId);

    if (!user) return null;

    const plan = SUBSCRIPTION_PLANS.find((p) => p.slug === user.plan) || SUBSCRIPTION_PLANS[0]; // Default to basic if invalid

    return {
        plan,
        razorpayCustomerId: user.razorpayCustomerId,
        razorpaySubscriptionId: user.razorpaySubscriptionId,
        status: user.subscriptionStatus,
        endDate: user.subscriptionEndDate,
    };
}

export async function checkLimit(userId: string, feature: "projects" | "communities") {
    await connectDB();
    const user = await User.findById(userId);

    if (!user) return false;

    // Trialing is considered Active for feature access
    const isProOrPremium = user.plan === "pro" || user.plan === "premium";
    const isActive = user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing";

    // If active pro/premium, usually unlimited or high limits.
    // But we should stick to config.
    const planConfig = SUBSCRIPTION_PLANS.find((p) => p.slug === user.plan) || SUBSCRIPTION_PLANS[0];

    // If plan limit is -1, it's unlimited
    if (planConfig.limits[feature] === -1) {
        return true;
    }

    let count = 0;

    if (feature === "projects") {
        count = await Project.countDocuments({ ownerId: userId });
    } else if (feature === "communities") {
        count = await Community.countDocuments({ ownerId: userId });
    }

    return count < planConfig.limits[feature];
}
