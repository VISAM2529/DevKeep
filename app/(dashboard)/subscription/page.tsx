import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserSubscription } from "@/lib/subscription";
import { PricingTable } from "@/components/subscription/PricingTable";
import { CheckCircle2, CreditCard, Calendar, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function SubscriptionPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return redirect("/login");
    }

    const subscription = await getUserSubscription(session.user.id);
    const planName = subscription?.plan?.name || "Basic";
    const nextPayment = subscription?.endDate?.toLocaleDateString() || "N/A";

    return (
        <div className="flex-1 space-y-12 p-4 md:p-8 pt-6 pb-20 no-scrollbar">
            {/* Page Header */}
            <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                    <CreditCard className="h-8 w-8 text-white/50" />
                    Billing & Subscription
                </h1>
                <p className="text-zinc-500 text-sm md:text-base max-w-2xl">
                    Manage your workspace environment, billing cycles, and secure your enterprise status with our flexible tiers.
                </p>
            </div>

            {/* Current Plan Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                    <div className="relative group overflow-hidden rounded-[24px] border border-white/5 bg-[#0A0A0A] p-8 shadow-2xl transition-all hover:border-white/10">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Active Subscription</span>
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black text-white">{planName} Plan</h2>
                                    <p className="text-zinc-500 mt-1 font-medium italic">Standard developer workspace permissions enabled.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 md:gap-8">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-zinc-500">
                                        <Calendar className="h-3 w-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-tighter">Renews On</span>
                                    </div>
                                    <p className="text-white font-bold">{nextPayment}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-zinc-500">
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-tighter">Next Charge</span>
                                    </div>
                                    <p className="text-white font-bold">
                                        {subscription?.plan?.price ? `₹${subscription.plan.price}` : "₹0.00"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-4 rounded-[24px] border border-dashed border-white/10 flex flex-col items-center justify-center p-8 text-center bg-white/[0.01]">
                    <p className="text-zinc-500 text-xs font-medium max-w-[200px] leading-relaxed">
                        Need a custom enterprise solution or multi-seat discounts?
                    </p>
                    <button className="mt-4 text-xs font-bold text-white hover:underline underline-offset-4 decoration-white/20">
                        Contact Sales Representative
                    </button>
                </div>
            </div>

            {/* Pricing Selection */}
            <div className="space-y-8">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-white">Upgrade your Workspace</h2>
                    <p className="text-zinc-500 text-sm max-w-sm mx-auto">
                        Choose the plan that best fits your development velocity and team size.
                    </p>
                </div>

                <PricingTable
                    currentPlan={subscription?.plan?.slug || "basic"}
                    subscriptionStatus={subscription?.status}
                />
            </div>
        </div>
    );
}
