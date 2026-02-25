"use client";

import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { HiddenSpaceProvider } from "@/components/providers/HiddenSpaceProvider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { SocketProvider } from "@/context/SocketProvider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <SocketProvider>
                <NotificationProvider>
                    <HiddenSpaceProvider>
                        {children}
                        <Toaster />
                        <Sonner />
                    </HiddenSpaceProvider>
                </NotificationProvider>
            </SocketProvider>
        </SessionProvider>
    );
}
