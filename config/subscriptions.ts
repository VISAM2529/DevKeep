export const SUBSCRIPTION_PLANS = [
    {
        name: "Basic",
        slug: "basic",
        price: 0,
        razorpayPlanId: "", // Free
        features: [
            "Up to 3 Projects",
            "1 Community",
            "Basic Analytics",
            "Standard Support",
        ],
        limits: {
            projects: 3,
            communities: 1,
        },
        trialDays: 0,
    },
    {
        name: "Pro",
        slug: "pro",
        price: 1499,
        razorpayPlanId: "plan_RzRNaNrwUmkCzT", // Placeholder - User needs to replace
        features: [
            "6 Projects",
            "3 Communities",
            "Advanced Analytics",
            "Priority Support",
            "7-Day Free Trial",
        ],
        limits: {
            projects: 6, // Unlimited
            communities: 3,
        },
        trialDays: 7,
    },
    {
        name: "Premium",
        slug: "premium",
        price: 2999,
        razorpayPlanId: "plan_RzROe7aMUyZp5L", // Placeholder - User needs to replace
        features: [
            "12 Projects",
            "6 Communities",
            "Advanced Analytics",
            "Priority Support",
            "14-Day Free Trial",
        ],
        limits: {
            projects: 12, 
            communities: 6, 
        },
        trialDays: 14,
    },
];
