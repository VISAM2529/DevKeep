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
        price: 9,
        razorpayPlanId: "plan_RzRNaNrwUmkCzT", // Placeholder - User needs to replace
        features: [
            "Unlimited Projects",
            "5 Communities",
            "Advanced Analytics",
            "Priority Support",
            "7-Day Free Trial",
        ],
        limits: {
            projects: -1, // Unlimited
            communities: 5,
        },
        trialDays: 7,
    },
    {
        name: "Premium",
        slug: "premium",
        price: 29,
        razorpayPlanId: "plan_RzROe7aMUyZp5L", // Placeholder - User needs to replace
        features: [
            "Unlimited Everything",
            "Unlimited Communities",
            "Custom Integrations",
            "Dedicated Manager",
            "14-Day Free Trial",
        ],
        limits: {
            projects: -1, // Unlimited
            communities: -1, // Unlimited
        },
        trialDays: 14,
    },
];
