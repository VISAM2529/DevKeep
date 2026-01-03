import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";
import { SUBSCRIPTION_PLANS } from "@/config/subscriptions";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || !session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { planId } = body;

        if (!planId) {
            return new NextResponse("Plan ID is required", { status: 400 });
        }

        const plan = SUBSCRIPTION_PLANS.find((p) => p.slug === planId);

        if (!plan || !plan.razorpayPlanId) {
            return new NextResponse("Invalid Plan", { status: 400 });
        }

        await connectDB();
        const user = await User.findById(session.user.id);

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Ensure user has a razorpayCustomerId if needed (optional for pure subscription flow, 
        // but useful if we want to attach customer info)
        // Razorpay Subscription API handles customer creation implicitly or explicitly. 
        // We will pass customer_id if exists, else Razorpay handles it.
        // For simplicity, we create a subscription directly to get the ID.

        const subscriptionOptions: any = {
            plan_id: plan.razorpayPlanId,
            customer_notify: 1,
            total_count: 120, // 10 years monthly
            notes: {
                userId: user._id.toString(),
                planSlug: plan.slug,
            }
        };

        const subscription = await razorpay.subscriptions.create(subscriptionOptions);

        return NextResponse.json({
            subscription_id: subscription.id,
            key_id: process.env.RAZORPAY_KEY_ID,
            plan_name: plan.name,
            currency: "USD", // Or INR based on your dashboard
            amount: plan.price * 100, // if needed for manual checkout, but subscription uses plan price
            description: `Subscribe to ${plan.name}`,
            name: "DevKeep",
            user_name: user.name,
            user_email: user.email,
            contact: "", // can get from user if available
        });
    } catch (error) {
        console.error("[RAZORPAY_SUBSCRIPTION]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
