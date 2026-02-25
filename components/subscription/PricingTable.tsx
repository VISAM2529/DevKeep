"use client";

import { useState } from "react";
import { SUBSCRIPTION_PLANS } from "@/config/subscriptions";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Sparkles, Zap, ShieldCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useHiddenSpace } from "@/components/providers/HiddenSpaceProvider";

interface PricingTableProps {
    currentPlan: string;
    subscriptionStatus?: string;
}

export function PricingTable({ currentPlan, subscriptionStatus }: PricingTableProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
    const router = useRouter();
    const { isHiddenMode } = useHiddenSpace();

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const onSubscribe = async (planId: string) => {
        setLoading(planId);
        try {
            const isLoaded = await loadRazorpayScript();

            if (!isLoaded) {
                toast.error("Razorpay SDK failed to load. Are you online?");
                setLoading(null);
                return;
            }

            const response = await fetch("/api/razorpay/subscription", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ planId, billingCycle }),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Failed to create subscription");
            }

            const data = await response.json();

            const options = {
                key: data.key_id,
                subscription_id: data.subscription_id,
                name: data.name,
                description: data.description,
                image: "/logo.png",
                handler: function (response: any) {
                    toast.success("Subscription Successful!");
                    router.refresh();
                    router.push("/dashboard");
                },
                prefill: {
                    name: data.user_name,
                    email: data.user_email,
                    contact: data.contact,
                },
                theme: {
                    color: "#0F172A",
                },
            };

            const rzp1 = new (window as any).Razorpay(options);
            rzp1.on('payment.failed', function (response: any) {
                toast.error(response.error.description || "Payment Failed");
            });
            rzp1.open();

        } catch (error: any) {
            toast.error(error.message || "Something went wrong. Please try again.");
            setLoading(null);
        }
    };

    return (
        <div className="space-y-10">
            {/* Billing Toggle */}
            <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-full">
                    <button
                        onClick={() => setBillingCycle("monthly")}
                        className={cn(
                            "px-5 py-1.5 rounded-full text-xs font-semibold transition-all",
                            billingCycle === "monthly"
                                ? "bg-white text-black"
                                : "text-zinc-500 hover:text-white"
                        )}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle("annual")}
                        className={cn(
                            "px-5 py-1.5 rounded-full text-xs font-semibold transition-all relative",
                            billingCycle === "annual"
                                ? "bg-white text-black"
                                : "text-zinc-500 hover:text-white"
                        )}
                    >
                        Annual
                        {/* <span className="absolute -top-2.5 -right-3 px-1.5 py-0.5 bg-amber-500 text-[8px] font-black text-black rounded-full">
                            SAVE 20%
                        </span> */}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
                {SUBSCRIPTION_PLANS.map((plan) => {
                    const isCurrent = currentPlan === plan.slug;
                    const isPro = plan.slug === "pro";
                    const isPremium = plan.slug === "premium";
                    const isFree = plan.price === 0;

                    const displayPrice = billingCycle === "annual"
                        ? plan.price * 12
                        : plan.price;

                    return (
                        <Card key={plan.slug} className={cn(
                            "flex flex-col relative transition-all duration-500 rounded-[24px] border border-white/5 group",
                            isPro
                                ? "bg-[#111111] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_1px_1px_rgba(255,255,255,0.1)] scale-105 z-10"
                                : "bg-[#1A1A1A]/40 backdrop-blur-sm",
                            "hover:-translate-y-3 hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.08),0_15px_20px_-10px_rgba(255,255,255,0.1),0_1px_0_0_rgba(255,255,255,0.2)] hover:border-white/10",
                            isCurrent && "ring-1 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)]"
                        )}>
                            <CardHeader className="pt-10 px-8 pb-4 text-left">
                                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3 block">{plan.name}</span>
                                <div className="flex items-baseline gap-2 mb-3">
                                    <span className="text-5xl font-bold text-white tracking-tight">₹{displayPrice.toLocaleString('en-IN')}</span>
                                    <span className="text-zinc-500 text-sm font-medium">/{billingCycle === "annual" ? "year" : "month"}</span>
                                </div>
                                <p className="text-zinc-500 text-[13px] leading-relaxed font-medium">
                                    {isFree ? "Perfect for individuals and small side projects" :
                                        isPro ? "Perfect for Small Teams, Startups, and Growing Businesses" :
                                            "Enterprise-grade solutions for large scale organizations"}
                                </p>
                            </CardHeader>

                            <CardContent className="flex-1 px-8 py-4">
                                <span className="text-zinc-300 text-[11px] font-bold uppercase tracking-widest mb-6 block">Features Included:</span>
                                <ul className="space-y-4">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-[13px] text-zinc-400 group-hover:text-zinc-200 transition-colors">
                                            <div className={cn(
                                                "mt-0.5 rounded-full p-0.5 transition-all duration-300",
                                                isPro || isPremium ? "bg-white text-black" : "bg-zinc-800 text-zinc-500"
                                            )}>
                                                <Check className="h-2.5 w-2.5" strokeWidth={5} />
                                            </div>
                                            <span className="leading-snug">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                {plan.trialDays > 0 && !isCurrent && (
                                    <div className="mt-6 flex items-center gap-2 text-[11px] text-zinc-500 font-medium">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>Start {plan.trialDays}-day free trial</span>
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="px-8 pb-10 pt-4">
                                <Button
                                    className={cn(
                                        "w-full h-12 rounded-[14px] font-bold transition-all duration-300",
                                        (isPro || isPremium)
                                            ? "bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] shadow-[0_10px_20px_-10px_rgba(255,255,255,0.2)]"
                                            : "bg-zinc-900 text-white hover:bg-black border border-white/5",
                                        isCurrent && "opacity-40 cursor-default grayscale"
                                    )}
                                    disabled={loading === plan.slug || isCurrent}
                                    onClick={() => !isCurrent && !isFree && onSubscribe(plan.slug)}
                                >
                                    {loading === plan.slug ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : isCurrent ? (
                                        "Your Current Plan"
                                    ) : isFree ? (
                                        "Get Started"
                                    ) : (
                                        `Upgrade to ${plan.name}`
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
