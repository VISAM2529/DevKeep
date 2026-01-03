import { NextResponse } from "next/server";
import crypto from "crypto";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";
import { SUBSCRIPTION_PLANS } from "@/config/subscriptions";

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        if (!signature) {
            return new NextResponse("Missing Signature", { status: 400 });
        }

        // Verify Signature
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
            .update(body)
            .digest("hex");

        if (signature !== expectedSignature) {
            return new NextResponse("Invalid Signature", { status: 400 });
        }

        const event = JSON.parse(body);
        const { payload } = event;

        await connectDB();

        // Handle Subscription Events
        if (event.event === "subscription.authenticated") {
            const subscription = payload.subscription.entity;
            const userId = subscription.notes.userId;
            const planSlug = subscription.notes.planSlug;

            if (userId) {
                await User.findByIdAndUpdate(userId, {
                    razorpaySubscriptionId: subscription.id,
                    razorpayCustomerId: subscription.customer_id,
                    plan: planSlug,
                    subscriptionStatus: 'active', // Authenticated means payment success usually
                    subscriptionEndDate: new Date(subscription.current_end * 1000),
                });
            }
        }

        if (event.event === "subscription.charged") {
            const subscription = payload.subscription.entity;
            const userId = subscription.notes.userId;

            if (userId) {
                await User.findByIdAndUpdate(userId, {
                    subscriptionStatus: 'active',
                    subscriptionEndDate: new Date(subscription.current_end * 1000),
                });
            }
        }

        if (event.event === "subscription.cancelled") {
            const subscription = payload.subscription.entity;
            const userId = subscription.notes.userId;

            if (userId) {
                await User.findByIdAndUpdate(userId, {
                    subscriptionStatus: 'canceled',
                    plan: 'basic',
                    subscriptionEndDate: new Date(),
                });
            }
        }

        return new NextResponse("OK", { status: 200 });
    } catch (error) {
        console.error("[RAZORPAY_WEBHOOK]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
