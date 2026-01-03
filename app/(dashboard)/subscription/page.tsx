import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserSubscription } from "@/lib/subscription";
import { PricingTable } from "@/components/subscription/PricingTable";
import { Separator } from "@/components/ui/separator";

export default async function SubscriptionPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return redirect("/login");
    }

    const subscription = await getUserSubscription(session.user.id);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Subscription</h2>
            </div>
            <p className="text-muted-foreground">
                Manage your subscription and billing details.
            </p>
            <Separator />
            <div className="py-6">
                <PricingTable
                    currentPlan={subscription?.plan.slug || "basic"}
                    subscriptionStatus={subscription?.status}
                />
            </div>
            {subscription?.status === "active" && (
                <div className="rounded-md bg-muted p-4">
                    <p className="text-sm text-muted-foreground">
                        Your <strong>{subscription.plan.name}</strong> plan is active.
                        {subscription.endDate && (
                            <> Renews on {subscription.endDate.toLocaleDateString()}.</>
                        )}
                    </p>
                    {/* Integrate Customer Portal Link Here if needed */}
                </div>
            )}
        </div>
    );
}
