"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Settings as SettingsIcon,
    Shield,
    Download,
    Upload,
    LogOut,
    Fingerprint,
    Globe,
    Zap,
    Trash2,
    ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { HiddenSpaceSettings } from "@/components/settings/HiddenSpaceSettings";

export default function SettingsPage() {
    const { data: session, update } = useSession();
    const { toast } = useToast();
    const [name, setName] = useState(session?.user?.name || "");
    const [birthDate, setBirthDate] = useState<Date | undefined>(
        session?.user?.birthDate ? new Date(session.user.birthDate) : undefined
    );
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdateProfile = async () => {
        setIsUpdating(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, birthDate }),
            });

            if (!res.ok) throw new Error("Failed to update profile");

            const updatedUser = await res.json();

            // Update session
            await update({
                ...session,
                user: {
                    ...session?.user,
                    name: updatedUser.name,
                    birthDate: updatedUser.birthDate
                }
            });

            toast({
                title: "Profile Updated",
                description: "Your identity has been successfully re-calibrated.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Update Failed",
                description: "Could not sync identity changes to the core.",
                variant: "destructive"
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleExport = async () => {
        toast({
            title: "Preparing Archive",
            description: "Your technical data segment is being compiled for export.",
        });
        // Simulated export
        setTimeout(() => {
            toast({
                title: "Buffer Dispatched",
                description: "JSON archive has been downloaded successfully.",
            });
        }, 2000);
    };

    return (
        <div className="p-8 md:p-12 max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
                <p className="text-muted-foreground max-w-md text-sm">
                    Configure your identity and manage your technical inheritance.
                </p>
            </div>

            <div className="grid gap-8">
                {/* Profile Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center gap-6 border-b border-border/40 pb-6">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={session?.user?.image || ""} />
                            <AvatarFallback className="text-lg font-semibold">
                                {getInitials(session?.user?.name || "User")}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold text-white">{session?.user?.name || "DevKeep Operator"}</h2>
                            <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                            <Badge variant="secondary" className="mt-2 text-xs font-medium">
                                Verified Entity
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Authorized Name</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Communication Node (Email)</label>
                                <Input defaultValue={session?.user?.email || ""} disabled className="opacity-50 cursor-not-allowed" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Birth Date (For Community Alerts)</label>
                                <DatePicker date={birthDate} setDate={setBirthDate} />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                className="h-10 px-6"
                                onClick={handleUpdateProfile}
                                disabled={isUpdating}
                            >
                                {isUpdating ? "Updating..." : "Update Identity"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Hidden Space Settings */}
                <HiddenSpaceSettings />

                {/* Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Globe className="h-4 w-4 text-blue-500" /> System Preferences
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[
                                { label: "Deep Space Mode", desc: "Toggle high-contrast dark aesthetic", active: true },
                                { label: "Auto-Lock Vault", desc: "Seal credentials after 5m of inactivity", active: true },
                                { label: "Terminal Notifications", desc: "Receive alerts for workspace updates", active: false },
                            ].map((pref, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-medium text-white">{pref.label}</div>
                                        <div className="text-xs text-muted-foreground">{pref.desc}</div>
                                    </div>
                                    <Switch checked={pref.active} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Shield className="h-4 w-4 text-purple-500" /> Privacy & Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button variant="outline" className="w-full justify-start h-12 px-4 group">
                                <div className="h-8 w-8 rounded-lg bg-secondary/50 flex items-center justify-center mr-4">
                                    <Fingerprint className="h-4 w-4 text-purple-500" />
                                </div>
                                <span className="flex-1 text-left text-sm font-medium text-muted-foreground group-hover:text-white">Active 2FA Segments</span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-12 px-4 group">
                                <div className="h-8 w-8 rounded-lg bg-secondary/50 flex items-center justify-center mr-4">
                                    <Shield className="h-4 w-4 text-blue-500" />
                                </div>
                                <span className="flex-1 text-left text-sm font-medium text-muted-foreground group-hover:text-white">Access Protocol History</span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Data Management */}
                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Zap className="h-4 w-4 text-white" /> Technical Inheritance
                        </CardTitle>
                        <CardDescription>Manage your persistent data segments</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="h-12 gap-2"
                                onClick={handleExport}
                            >
                                <Download className="h-4 w-4" /> Export Data Archive
                            </Button>
                            <Button variant="outline" className="h-12 gap-2">
                                <Upload className="h-4 w-4" /> Import Data Fragment
                            </Button>
                        </div>
                        <div className="pt-6 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-1">
                                <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
                                <p className="text-xs text-muted-foreground">Irreversible system termination and segment purge.</p>
                            </div>
                            <Button variant="outline" className="h-10 border-destructive/20 hover:bg-destructive/10 text-destructive gap-2">
                                <Trash2 className="h-4 w-4" /> Terminate Node
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Section */}
                <div className="flex flex-col items-center gap-6 py-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            className="h-12 px-8 gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => signOut({ callbackUrl: "/" })}
                        >
                            <LogOut className="h-4 w-4" /> Terminate Session
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 opacity-50">
                        <span className="text-xs text-muted-foreground font-medium">DevKeep Persistence Module v1.0</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
