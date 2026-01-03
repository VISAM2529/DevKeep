"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Code2,
    LayoutDashboard,
    FolderKanban,
    Lock,
    Terminal,
    FileText,
    LogOut,
    Settings,
    ChevronRight,
    Plus,
    Zap,
    Users,
    CreditCard,
    ShieldCheck
} from "lucide-react";
import { CommandPalette } from "@/components/CommandPalette";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { NotificationCenter } from "./NotificationCenter";
import { useHiddenSpace } from "@/components/providers/HiddenSpaceProvider";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: FolderKanban, badgeKey: "totalProjectsUnread" },
    { name: "Communities", href: "/communities", icon: Users, badgeKey: "totalCommunitiesUnread" },
    { name: "Identity Vault", href: "/credentials", icon: Lock },
    { name: "Snippets", href: "/commands", icon: Terminal },
    { name: "Documentation", href: "/notes", icon: FileText },
    { name: "Subscription", href: "/subscription", icon: CreditCard },
] as const;

interface SidebarProps {
    onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { counts, requestPermission } = useNotifications();
    const { isHiddenMode } = useHiddenSpace();

    const handleLinkClick = () => {
        if (onClose) onClose();
    };

    return (
        <div className={cn(
            "flex h-full w-[280px] flex-col border-r transition-colors duration-500",
            isHiddenMode
                ? "bg-[#050505] border-purple-900/50 shadow-[0_0_30px_rgba(168,85,247,0.05)]"
                : "bg-[#0A0A0A] border-[#1F1F1F]"
        )}>
            {/* Logo */}
            <div className="flex h-[72px] items-center justify-between px-6">
                <div className="flex items-center gap-3 group">
                    <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-500",
                        isHiddenMode
                            ? "bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20"
                            : "bg-white/5 text-white/80 group-hover:bg-white/10"
                    )}>
                        {isHiddenMode ? <ShieldCheck className="h-5 w-5" /> : <Zap className="h-5 w-5 fill-current" />}
                    </div>
                    <span className={cn(
                        "text-xl font-bold tracking-tight transition-colors duration-500",
                        isHiddenMode ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600" : "text-white/90"
                    )}>
                        {isHiddenMode ? "DevHide" : "DevKeep"}
                    </span>
                </div>
                <NotificationCenter />
            </div>

            {/* Create Button (Triggers Command Palette) */}
            <div className="px-5 mb-6">
                <CommandPalette
                    trigger={
                        <button className="w-full flex items-center gap-3 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white/90 border border-white/5 transition-all h-12 px-4 rounded-xl group">
                            <Plus className="h-5 w-5 text-white/70" />
                            <span className="text-sm font-medium">Create</span>
                        </button>
                    }
                />
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 mb-6">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                    const badgeCount = "badgeKey" in item ? (counts[item.badgeKey as keyof typeof counts] as number) : 0;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={handleLinkClick}
                            className={cn(
                                "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? isHiddenMode
                                        ? "text-purple-400 bg-purple-500/10 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                                        : "text-white bg-[#1A1A1A] border border-white/5"
                                    : "text-[#888888] hover:text-white hover:bg-[#1A1A1A]"
                            )}
                        >
                            <div className="flex items-center gap-3.5">
                                <item.icon
                                    className={cn(
                                        "h-5 w-5 transition-colors",
                                        isActive
                                            ? isHiddenMode ? "text-purple-400" : "text-white"
                                            : "text-[#888888] group-hover:text-white"
                                    )}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                {item.name}
                            </div>
                            {badgeCount > 0 && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg shadow-red-500/20">
                                    {badgeCount > 99 ? "99+" : badgeCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Desktop Notification Promo */}
            {typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted" && (
                <div className="px-5 mb-6">
                    <button
                        onClick={() => requestPermission()}
                        className="w-full flex items-center gap-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all py-3 px-4 rounded-xl group"
                    >
                        <Zap className="h-4 w-4 fill-current" />
                        <span className="text-xs font-semibold">Enable Desktop Alerts</span>
                    </button>
                </div>
            )}

            {/* Bottom Section */}
            <div className="p-4 mt-auto">
                <div className="rounded-2xl bg-[#131313] border border-white/5 p-1">
                    <Link href="/settings" onClick={handleLinkClick}>
                        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                            <Avatar className="h-9 w-9 border border-white/10">
                                <AvatarImage src={session?.user?.image || ""} />
                                <AvatarFallback className="bg-[#1A1A1A] text-white text-xs font-bold">
                                    {getInitials(session?.user?.name || "User")}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white/90 truncate">
                                    {session?.user?.name || "User"}
                                </p>
                                <p className="text-[11px] text-[#555] truncate">
                                    Workspace Admin
                                </p>
                            </div>
                        </div>
                    </Link>

                    <div className="h-px bg-white/5 my-1 mx-2" />

                    <div className="grid grid-cols-2 gap-1 px-1 pb-1">
                        <Link href="/settings" className="w-full" onClick={handleLinkClick}>
                            <div className="flex items-center justify-center h-9 w-full rounded-lg text-[#666] hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                                <Settings className="h-4 w-4" />
                            </div>
                        </Link>
                        <div
                            className="flex items-center justify-center h-9 w-full rounded-lg text-[#666] hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            onClick={() => {
                                handleLinkClick();
                                signOut({ callbackUrl: "/" });
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
