"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, RotateCw, ChevronLeft, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Provider detection ---
const EMAIL_PROVIDERS: { domains: string[]; name: string; url: string; color: string }[] = [
    {
        domains: ["gmail.com", "googlemail.com"],
        name: "Open Gmail",
        url: "https://mail.google.com",
        color: "#EA4335",
    },
    {
        domains: ["outlook.com", "hotmail.com", "live.com", "msn.com"],
        name: "Open Outlook",
        url: "https://outlook.live.com",
        color: "#0078D4",
    },
    {
        domains: ["proton.me", "protonmail.com", "protonmail.ch"],
        name: "Open ProtonMail",
        url: "https://mail.proton.me",
        color: "#6D4AFF",
    },
    {
        domains: ["icloud.com", "me.com", "mac.com"],
        name: "Open iCloud Mail",
        url: "https://www.icloud.com/mail",
        color: "#1C1C1E",
    },
    {
        domains: ["yahoo.com", "ymail.com"],
        name: "Open Yahoo Mail",
        url: "https://mail.yahoo.com",
        color: "#6001D2",
    },
];

function detectProvider(email: string) {
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return null;
    return EMAIL_PROVIDERS.find((p) => p.domains.includes(domain)) ?? null;
}

// Animated envelope SVG
function EnvelopeAnimation() {
    return (
        <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-violet-500/10 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-violet-500/10 animate-pulse" />
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
                <Mail className="w-8 h-8 text-white" />
            </div>
        </div>
    );
}

function CheckInboxContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") ?? "";

    const provider = email ? detectProvider(email) : null;

    const [resendCooldown, setResendCooldown] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const [resendStatus, setResendStatus] = useState<"idle" | "success" | "error">("idle");

    // --- Live polling every 5 seconds ---
    useEffect(() => {
        if (!email) return;
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/auth/check-verification?email=${encodeURIComponent(email)}`);
                const data = await res.json();
                if (data.verified) {
                    clearInterval(interval);
                    router.push("/login?verified=1");
                }
            } catch {
                // silent fail — just try again next tick
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [email, router]);

    // --- Cooldown timer ---
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    const handleResend = useCallback(async () => {
        if (resendCooldown > 0 || isResending || !email) return;
        setIsResending(true);
        setResendStatus("idle");
        try {
            const res = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                setResendStatus("success");
                setResendCooldown(30);
            } else {
                setResendStatus("error");
            }
        } catch {
            setResendStatus("error");
        } finally {
            setIsResending(false);
        }
    }, [email, resendCooldown, isResending]);

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background px-4 py-16">
            {/* Ambient background blobs */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-500/5 blur-[120px] animate-pulse" />

            <div className="w-full max-w-[480px] relative z-10">
                <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-8"
                >
                    <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to signup
                </Link>

                {/* Main card */}
                <div className="relative rounded-2xl border border-white/8 bg-card/90 overflow-hidden shadow-2xl">
                    {/* Subtle grid pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.025] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />

                    <div className="relative z-10 p-8 sm:p-10 text-center space-y-6">
                        <EnvelopeAnimation />

                        <div className="space-y-3">
                            <h1 className="text-3xl font-black tracking-tight text-foreground">
                                Check your inbox
                            </h1>
                            <p className="text-muted-foreground text-base leading-relaxed">
                                We sent a verification link to your email to complete account setup.
                            </p>
                            {email && (
                                <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mt-1">
                                    <Mail className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                                    <span className="text-sm font-semibold text-foreground">{email}</span>
                                </div>
                            )}
                        </div>

                        {/* Open email provider button */}
                        {provider ? (
                            <Button
                                className="w-full h-12 text-base rounded-xl font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-foreground transition-all"
                                variant="outline"
                                onClick={() => window.open(provider.url, "_blank", "noopener,noreferrer")}
                            >
                                <ExternalLink className="mr-2 h-4 w-4" style={{ color: provider.color }} />
                                {provider.name}
                            </Button>
                        ) : email ? (
                            <p className="text-sm text-muted-foreground bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                                Please check your email inbox to verify your account.
                                <br />
                                <span className="text-yellow-400/80 text-xs mt-1 block">
                                    Don&apos;t forget to check your spam folder.
                                </span>
                            </p>
                        ) : null}

                        {/* Live verification notice */}
                        <p className="text-xs text-muted-foreground/60 flex items-center justify-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                            Auto-detecting verification… this page will redirect automatically.
                        </p>

                        {/* Divider */}
                        <div className="h-px bg-white/6" />

                        {/* Resend area */}
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Didn&apos;t receive the email?
                            </p>

                            <Button
                                variant="ghost"
                                disabled={resendCooldown > 0 || isResending}
                                onClick={handleResend}
                                className="w-full h-11 rounded-xl text-sm font-semibold text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RotateCw className={`mr-2 h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
                                {resendCooldown > 0
                                    ? `Resend available in ${resendCooldown}s`
                                    : isResending
                                        ? "Sending..."
                                        : "Resend Verification Email"}
                            </Button>

                            {resendStatus === "success" && (
                                <p className="text-xs text-green-400">
                                    ✓ New verification email sent! Check your inbox.
                                </p>
                            )}
                            {resendStatus === "error" && (
                                <p className="text-xs text-red-400 flex items-center justify-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Failed to resend. Please try again.
                                </p>
                            )}

                            <Link
                                href="/signup"
                                className="block text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                            >
                                Wrong address? <span className="text-violet-400 underline underline-offset-2">Change email</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground/40 mt-6">
                    The verification link expires in 15 minutes.
                </p>
            </div>
        </div>
    );
}

export default function CheckInboxPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            </div>
        }>
            <CheckInboxContent />
        </Suspense>
    );
}
