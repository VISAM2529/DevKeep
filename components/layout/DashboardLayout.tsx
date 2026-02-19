"use client";

import { Sidebar } from "./Sidebar";
import { useState, useEffect } from "react";
import { Menu, X, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHiddenSpace } from "@/components/providers/HiddenSpaceProvider";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "./NotificationCenter";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const { isHiddenMode } = useHiddenSpace();

    useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem("sidebar-collapsed");
        if (saved !== null) {
            setIsSidebarCollapsed(saved === "true");
        }
    }, []);

    const toggleSidebarCollapse = () => {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);
        localStorage.setItem("sidebar-collapsed", String(newState));
    };

    if (!isMounted) {
        return <div className="h-screen bg-black" />;
    }

    return (
        <div className={cn(
            "flex h-screen overflow-hidden transition-colors duration-500",
            isHiddenMode ? "bg-[#030303] text-purple-50" : "bg-black text-white"
        )}>
            {/* Header */}
            <header className={cn(
                "lg:hidden fixed top-0 left-0 right-0 h-16 border-b backdrop-blur-md z-40 flex items-center justify-between px-4 transition-all duration-500",
                isHiddenMode
                    ? "bg-[#050505]/80 border-purple-900/50"
                    : "bg-black/80 border-white/5"
            )}>
                {/* Left: Logo + Text */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 shrink-0",
                        isHiddenMode
                            ? "bg-purple-500/10 text-purple-400"
                            : "bg-white/5 text-white/80"
                    )}>
                        {isHiddenMode ? <ShieldCheck className="h-6 w-6" /> : <Zap className="h-6 w-6 fill-current" />}
                    </div>
                    <span className={cn(
                        "text-xl font-bold tracking-tight whitespace-nowrap transition-colors duration-500",
                        isHiddenMode ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600" : "text-white/90"
                    )}>
                        {isHiddenMode ? "DevHide" : "DevKeep"}
                    </span>
                </div>

                {/* Right: Actions + Menu */}
                <div className="flex items-center gap-2">
                    <NotificationCenter />
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={cn(
                            "h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200",
                            isHiddenMode
                                ? "text-purple-400 hover:bg-purple-900/20"
                                : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        {isSidebarOpen ? (
                            <X className="h-5 w-5 animate-in spin-in-90 duration-200" />
                        ) : (
                            <Menu className="h-5 w-5 animate-in fade-in duration-200" />
                        )}
                    </button>
                </div>
            </header>

            {/* Sidebar Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 h-full",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full",
                isSidebarCollapsed ? "lg:w-[72px]" : "lg:w-[280px]"
            )}>
                <Sidebar
                    onClose={() => setIsSidebarOpen(false)}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={toggleSidebarCollapse}
                />
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto lg:h-full lg:pt-0 pt-16 no-scrollbar">
                {children}
            </main>
        </div>
    );
}
