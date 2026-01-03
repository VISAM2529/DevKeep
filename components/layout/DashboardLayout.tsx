"use client";

import { Sidebar } from "./Sidebar";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHiddenSpace } from "@/components/providers/HiddenSpaceProvider";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isHiddenMode } = useHiddenSpace();

    return (
        <div className={cn(
            "flex h-screen overflow-hidden transition-colors duration-500",
            isHiddenMode ? "bg-[#030303] text-purple-50" : "bg-black text-white"
        )}>
            {/* Mobile Header */}
            <div className={cn(
                "lg:hidden fixed top-0 left-0 right-0 h-16 border-b backdrop-blur-md z-40 flex items-center justify-between px-4 transition-colors duration-500",
                isHiddenMode
                    ? "bg-[#050505]/80 border-purple-900/50"
                    : "bg-black/80 border-white/5"
            )}>
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shadow-lg transition-colors",
                        isHiddenMode ? "bg-purple-900/50 text-purple-400" : "bg-primary text-white"
                    )}>
                        <span className="font-bold text-lg">D</span>
                    </div>
                    <span className={cn(
                        "font-bold transition-colors",
                        isHiddenMode ? "text-purple-100" : "text-white/90"
                    )}>
                        {isHiddenMode ? "DevHide" : "DevKeep"}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={isHiddenMode ? "text-purple-400 hover:text-purple-300 hover:bg-purple-900/20" : ""}
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
                "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 h-full",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto lg:h-full lg:pt-0 pt-16 scrollbar-hide">
                {children}
            </main>
        </div>
    );
}
