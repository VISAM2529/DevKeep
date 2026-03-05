"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type VerifyState = "loading" | "success" | "already_verified" | "expired" | "invalid" | "error";

// Animated success checkmark
function SuccessAnimation() {
    return (
        <div className="relative flex items-center justify-center w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-500/15 animate-ping" />
            <div className="absolute inset-3 rounded-full bg-emerald-500/15 animate-pulse" />
            <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center shadow-xl shadow-emerald-500/40">
                {/* Animated SVG checkmark */}
                <svg
                    viewBox="0 0 52 52"
                    className="w-10 h-10"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <style>{`
                        @keyframes drawCheck {
                            0% { stroke-dashoffset: 100; }
                            100% { stroke-dashoffset: 0; }
                        }
                        .check-path {
                            stroke-dasharray: 100;
                            animation: drawCheck 0.6s ease forwards 0.3s;
                            stroke-dashoffset: 100;
                        }
                    `}</style>
                    <polyline className="check-path" points="14,26 22,34 38,18" />
                </svg>
            </div>
        </div>
    );
}

function ErrorAnimation({ type }: { type: "expired" | "invalid" | "error" }) {
    return (
        <div className="relative flex items-center justify-center w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse" />
            <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center shadow-xl shadow-red-500/30">
                <XCircle className="w-10 h-10 text-white" />
            </div>
        </div>
    );
}

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [state, setState] = useState<VerifyState>("loading");
    const [countdown, setCountdown] = useState(3);
    const [userEmail, setUserEmail] = useState("");
    const [isResending, setIsResending] = useState(false);
    const [resendDone, setResendDone] = useState(false);

    // Verify the token
    useEffect(() => {
        if (!token) {
            setState("invalid");
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
                const data = await res.json();

                if (!res.ok) {
                    if (data.error?.includes("expired")) {
                        setState("expired");
                    } else {
                        setState("invalid");
                    }
                    return;
                }

                if (data.alreadyVerified) {
                    setState("already_verified");
                    setUserEmail(data.email ?? "");
                    return;
                }

                setUserEmail(data.email ?? "");
                setState("success");
            } catch {
                setState("error");
            }
        };

        verify();
    }, [token]);

    // Countdown + auto-redirect on success
    useEffect(() => {
        if (state !== "success" && state !== "already_verified") return;

        if (countdown <= 0) {
            router.push("/login?verified=1");
            return;
        }

        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [state, countdown, router]);

    const handleResend = async () => {
        if (!userEmail || isResending) return;
        setIsResending(true);
        try {
            await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userEmail }),
            });
            setResendDone(true);
        } catch {
            // silent
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background px-4 py-16">
            {/* Ambient blobs */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-500/5 blur-[120px] animate-pulse" />

            <div className="w-full max-w-[460px] relative z-10">
                {/* Card */}
                <div className="relative rounded-2xl border border-white/8 bg-card/90 overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 opacity-[0.025] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />

                    <div className="relative z-10 p-8 sm:p-10 text-center space-y-6">

                        {/* Loading state */}
                        {state === "loading" && (
                            <>
                                <div className="flex justify-center mb-6">
                                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                        <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
                                    </div>
                                </div>
                                <h1 className="text-2xl font-bold text-foreground">Verifying your email…</h1>
                                <p className="text-muted-foreground">Please wait while we confirm your email address.</p>
                            </>
                        )}

                        {/* Success state */}
                        {(state === "success" || state === "already_verified") && (
                            <>
                                <SuccessAnimation />
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-black tracking-tight text-foreground">
                                        {state === "already_verified" ? "Already Verified!" : "Email Verified Successfully"}
                                    </h1>
                                    <p className="text-muted-foreground text-base">
                                        {state === "already_verified"
                                            ? "Your email was already verified. Redirecting you to login."
                                            : "Your DevKeep account is now activated."}
                                    </p>
                                </div>

                                {/* Progress bar countdown */}
                                <div className="space-y-3">
                                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-1000"
                                            style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Redirecting to login in <span className="text-emerald-400 font-bold">{countdown}s</span>…
                                    </p>
                                    <Link
                                        href="/login?verified=1"
                                        className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors block"
                                    >
                                        Click here if you are not redirected
                                    </Link>
                                </div>
                            </>
                        )}

                        {/* Expired token */}
                        {state === "expired" && (
                            <>
                                <ErrorAnimation type="expired" />
                                <div className="space-y-2">
                                    <h1 className="text-2xl font-bold text-foreground">Verification Link Expired</h1>
                                    <p className="text-muted-foreground text-sm">
                                        This verification link has expired. Verification links are valid for 15 minutes.
                                    </p>
                                </div>

                                {resendDone ? (
                                    <p className="text-sm text-emerald-400">✓ New verification email sent! Check your inbox.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {userEmail && (
                                            <Button
                                                className="w-full h-11 rounded-xl font-semibold"
                                                variant="premium"
                                                disabled={isResending}
                                                onClick={handleResend}
                                            >
                                                <RotateCw className={`mr-2 h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
                                                {isResending ? "Sending…" : "Resend Verification Email"}
                                            </Button>
                                        )}
                                        <Link href="/signup">
                                            <Button variant="ghost" className="w-full h-11 rounded-xl text-sm">
                                                Return to Signup
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Invalid token */}
                        {(state === "invalid" || state === "error") && (
                            <>
                                <ErrorAnimation type="invalid" />
                                <div className="space-y-2">
                                    <h1 className="text-2xl font-bold text-foreground">
                                        {state === "invalid" ? "Invalid Verification Link" : "Verification Failed"}
                                    </h1>
                                    <p className="text-muted-foreground text-sm">
                                        {state === "invalid"
                                            ? "This verification link is invalid or has already been used."
                                            : "Something went wrong. Please try again."}
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <Link href="/signup">
                                        <Button variant="premium" className="w-full h-11 rounded-xl font-semibold">
                                            Create a new account
                                        </Button>
                                    </Link>
                                    <Link href="/login">
                                        <Button variant="ghost" className="w-full h-11 rounded-xl text-sm">
                                            Back to Login
                                        </Button>
                                    </Link>
                                </div>
                            </>
                        )}

                    </div>
                </div>

                {/* DevKeep branding */}
                <p className="text-center text-xs text-muted-foreground/40 mt-6">
                    DevKeep · Secure Developer Workspace
                </p>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
