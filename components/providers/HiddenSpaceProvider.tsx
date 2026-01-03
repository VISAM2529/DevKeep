"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

interface HiddenSpaceContextType {
    isHiddenMode: boolean;
    toggleHiddenMode: (password: string) => Promise<boolean>;
    exitHiddenMode: () => void;
    checkHiddenPasswordSet: () => Promise<boolean>;
}

const HiddenSpaceContext = createContext<HiddenSpaceContextType>({
    isHiddenMode: false,
    toggleHiddenMode: async () => false,
    exitHiddenMode: () => { },
    checkHiddenPasswordSet: async () => false,
});

export function HiddenSpaceProvider({ children }: { children: React.ReactNode }) {
    const [isHiddenMode, setIsHiddenMode] = useState(false);
    const router = useRouter();

    // Persist hidden mode across page refreshes if needed, or clear it for security.
    // For "DevHide", clearing on refresh/reload is safer, making it strictly session-based.
    // However, refreshing in hidden mode would kick you out. Let's keep it in session storage.

    useEffect(() => {
        const stored = sessionStorage.getItem("devkeep-hidden-mode");
        if (stored === "true") {
            setIsHiddenMode(true);
        }
    }, []);

    const toggleHiddenMode = async (password: string): Promise<boolean> => {
        if (isHiddenMode) {
            // If already hidden, "toggle" means exit? Or maybe just do nothing?
            // Usually toggle means switch state. But here we take password to ENTER.
            exitHiddenMode();
            return true;
        }

        try {
            const res = await fetch("/api/auth/hidden-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "verify", password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setIsHiddenMode(true);
                sessionStorage.setItem("devkeep-hidden-mode", "true");
                toast.success("Welcome to DevHide");
                router.refresh();
                return true;
            } else {
                toast.error("Invalid Hidden Space Password");
                return false;
            }
        } catch (error) {
            console.error("Failed to verify hidden password", error);
            toast.error("Something went wrong");
            return false;
        }
    };

    const exitHiddenMode = () => {
        setIsHiddenMode(false);
        sessionStorage.removeItem("devkeep-hidden-mode");
        toast.info("Exited Hidden Space");
        router.push("/dashboard"); // Redirect to main dashboard on exit
        router.refresh();
    };

    const checkHiddenPasswordSet = async (): Promise<boolean> => {
        // This usually requires an API endpoint to check "is password set?" without revealing it.
        // For now we assume the verify API handles "not set" 404.
        // We can add a simple "check" action or just rely on the user knowing if they set it.
        // Let's implement a 'check' check later if needed, for now return true to allow attempt.
        return true;
    };

    return (
        <HiddenSpaceContext.Provider
            value={{
                isHiddenMode,
                toggleHiddenMode,
                exitHiddenMode,
                checkHiddenPasswordSet,
            }}
        >
            <div className={isHiddenMode ? "devhide-theme" : ""}>
                {children}
            </div>
        </HiddenSpaceContext.Provider>
    );
}

export const useHiddenSpace = () => useContext(HiddenSpaceContext);
