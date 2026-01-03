"use client";

import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { HiddenSpaceProvider } from "@/components/providers/HiddenSpaceProvider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <NotificationProvider>
                <HiddenSpaceProvider>
                    {children}
                    <Toaster />
                    <Sonner />
                </HiddenSpaceProvider>
            </NotificationProvider>
        </SessionProvider>
    );
}
