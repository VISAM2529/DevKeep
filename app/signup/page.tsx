"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Code2, Loader2, User, Mail, Lock, ChevronLeft, ShieldCheck } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                toast({
                    variant: "destructive",
                    title: "Registration Failed",
                    description: data.error || "Failed to create account",
                });
                return;
            }

            toast({
                title: "Account Provisioned",
                description: "Your workspace is ready. Initializing session...",
            });

            // Auto sign in after successful registration
            const result = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                router.push("/login");
            } else {
                router.push("/dashboard");
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "System Error",
                description: "Something went wrong during provisioning.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await signIn("google", { callbackUrl: "/dashboard" });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "OAuth Error",
                description: "Failed to sign up with Google",
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background px-4 py-12">
            {/* Background blobs */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-electric-purple/5 blur-[120px] animate-pulse" />

            <div className="w-full max-w-[440px] space-y-8 relative z-10">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-4"
                >
                    <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to main
                </Link>

                <Card className="border-white/10 bg-card/90 shadow-2xl relative overflow-hidden">
                    {/* Security Pattern Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
                    <CardHeader className="space-y-4 text-center pb-8">
                        <div className="flex justify-center">
                            <div className="h-16 w-16 rounded-2xl bg-electric-purple flex items-center justify-center shadow-xl ring-1 ring-white/20">
                                <ShieldCheck className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-3xl font-black tracking-tight">Provision Account</CardTitle>
                            <CardDescription className="text-base">
                                Join the network of secure developers
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Button
                            variant="outline"
                            className="w-full h-12 text-base rounded-xl border-white/5 bg-white/5 hover:bg-white/10"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                        >
                            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Sign up with Google
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/5" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-widest">
                                <span className="bg-transparent px-4 text-white/30 backdrop-blur-xl">
                                    Registration Protocol
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-white/50 ml-1">Alias</Label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-glow transition-colors" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="John Doe"
                                        className="pl-11 h-12"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-white/50 ml-1">Terminal ID</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-glow transition-colors" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@kernel.org"
                                        className="pl-11 h-12"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-white/50 ml-1">Access Key</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-glow transition-colors" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-11 h-12"
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData({ ...formData, password: e.target.value })
                                        }
                                        required
                                        minLength={6}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <Button type="submit" variant="premium" className="w-full h-12 text-base rounded-xl mt-4" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Initiate Provisioning"}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pb-8">
                        <div className="text-sm text-center">
                            <span className="text-white/60">Already an operator?</span>{" "}
                            <Link href="/login" className="text-primary hover:text-white font-bold transition-all ml-1 underline underline-offset-4">
                                Authorize Entry
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
