"use client";

import { useState } from "react";
import { SUBSCRIPTION_PLANS } from "@/config/subscriptions";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
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

declare global {
    interface Window {
        Razorpay: any;
    }
}

export function PricingTable({ currentPlan, subscriptionStatus }: PricingTableProps) {
    const [loading, setLoading] = useState<string | null>(null);
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
                body: JSON.stringify({ planId }),
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
                image: "/logo.png", // Add your logo here
                handler: function (response: any) {
                    toast.success("Subscription Successful!");
                    // Ideally we verify payment on server here via another API call
                    // For now, we rely on webhook or just refresh
                    router.refresh();
                    router.push("/settings");
                },
                prefill: {
                    name: data.user_name,
                    email: data.user_email,
                    contact: data.contact,
                },
                theme: {
                    color: "#0F172A", // Slate 900
                },
            };

            const rzp1 = new window.Razorpay(options);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SUBSCRIPTION_PLANS.map((plan) => {
                const isCurrent = currentPlan === plan.slug;
                const isFree = plan.price === 0;

                return (
                    <Card key={plan.slug} className={cn(
                        "flex flex-col relative transition-all duration-300",
                        isCurrent ? "border-primary shadow-lg" : "",
                        isHiddenMode
                            ? "bg-black/40 border-purple-500/20 hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]"
                            : ""
                    )}>
                        {isCurrent && (
                            <div className="absolute top-0 right-0 -mt-2 -mr-2">
                                <Badge variant="secondary" className={cn(
                                    "text-primary-foreground",
                                    isHiddenMode ? "bg-purple-600 text-white" : "bg-primary hover:bg-primary/90"
                                )}>
                                    Current Plan
                                </Badge>
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className={cn("text-xl", isHiddenMode ? "text-purple-100" : "")}>{plan.name}</CardTitle>
                            <CardDescription className={isHiddenMode ? "text-purple-300/60" : ""}>
                                {isFree ? "Forever free" : "Billed monthly"}
                            </CardDescription>
                            <div className="mt-4">
                                <span className={cn("text-4xl font-bold", isHiddenMode ? "text-white" : "")}>${plan.price}</span>
                                <span className={cn("ml-1", isHiddenMode ? "text-purple-400" : "text-muted-foreground")}>/mo</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            {plan.trialDays > 0 && (
                                <div className={cn("mb-4 text-sm font-medium", isHiddenMode ? "text-green-400" : "text-green-600 dark:text-green-400")}>
                                    {plan.trialDays}-Day Free Trial Included
                                </div>
                            )}
                            <ul className="space-y-3">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className={cn("flex items-start gap-2 text-sm", isHiddenMode ? "text-purple-100/80" : "text-foreground/80")}>
                                        <Check className={cn("h-4 w-4 shrink-0 mt-0.5", isHiddenMode ? "text-purple-400" : "text-primary")} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className={cn("w-full", isHiddenMode && !isCurrent ? "bg-purple-600 hover:bg-purple-700 text-white border-none" : "")}
                                variant={isCurrent ? "outline" : "default"}
                                disabled={loading === plan.slug || isCurrent}
                                onClick={() => !isCurrent && !isFree && onSubscribe(plan.slug)}
                            >
                                {loading === plan.slug && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isCurrent ? "Active" : isFree ? "Get Started" : `Upgrade to ${plan.name}`}
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
