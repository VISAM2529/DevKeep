"use client";

import { SessionProvider } from "next-auth/react";
import { Sidebar } from "./Sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-background">
                    {children}
                </main>
            </div>
        </SessionProvider>
    );
}
