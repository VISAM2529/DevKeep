"use client";

import { SessionProvider } from "next-auth/react";
import { Sidebar } from "./Sidebar";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationProvider } from "@/components/providers/NotificationProvider";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <SessionProvider>
            <NotificationProvider>
                <div className="flex h-screen overflow-hidden bg-background">
                    {/* Mobile Header */}
                    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-background/80 backdrop-blur-md z-40 flex items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-lg">D</span>
                            </div>
                            <span className="font-bold text-white/90">DevKeep</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>

                    {/* Sidebar Overlay for mobile */}
                    {isSidebarOpen && (
                        <div
                            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}

                    {/* Sidebar */}
                    <div className={cn(
                        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
                        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    )}>
                        <Sidebar onClose={() => setIsSidebarOpen(false)} />
                    </div>

                    {/* Main Content */}
                    <main className="flex-1 overflow-y-auto lg:h-full lg:pt-0 pt-16">
                        {children}
                    </main>
                </div>
            </NotificationProvider>
        </SessionProvider>
    );
}

import { cn } from "@/lib/utils";
