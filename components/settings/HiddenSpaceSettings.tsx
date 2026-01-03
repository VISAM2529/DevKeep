"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { useHiddenSpace } from "@/components/providers/HiddenSpaceProvider";

export function HiddenSpaceSettings() {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/hidden-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "set", password }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Hidden Space PIN updated successfully");
                setPassword("");
            } else {
                toast.error(data.error || "Failed to update PIN");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-white">Hidden Space</h3>
                    <p className="text-sm text-[#888]">
                        Manage access to your private projects.
                    </p>
                </div>
            </div>

            <Card className="border-[#1F1F1F] bg-[#131313] text-[#EDEDED]">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-purple-400" />
                        <CardTitle className="text-base">Security PIN</CardTitle>
                    </div>
                    <CardDescription>
                        Set a unique PIN or Password to access your Hidden Space.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSetPassword} className="space-y-4 max-w-sm">
                        <div className="space-y-2">
                            <Label htmlFor="pin">New PIN / Password</Label>
                            <Input
                                id="pin"
                                type="password"
                                placeholder="Enter secure PIN"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-[#0A0A0A] border-white/10"
                                required
                                minLength={4}
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading || password.length < 4}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {loading ? "Updating..." : "Update PIN"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
