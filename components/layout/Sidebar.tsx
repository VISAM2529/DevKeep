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
    ShieldCheck,
    PanelLeftClose,
    PanelLeftOpen,
    HelpCircle,
    Sparkles
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CommandPalette } from "@/components/CommandPalette";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { NotificationCenter } from "./NotificationCenter";
import { useHiddenSpace } from "@/components/providers/HiddenSpaceProvider";
import { useState, useEffect } from "react";

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
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export function Sidebar({ onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { counts, requestPermission } = useNotifications();
    const { isHiddenMode } = useHiddenSpace();

    const handleLinkClick = () => {
        if (onClose) onClose();
    };

    return (
        <div className={cn(
            "flex h-full flex-col border-r transition-all duration-300 ease-in-out",
            isCollapsed ? "w-[72px]" : "w-[280px]",
            isHiddenMode
                ? "bg-[#050505] border-purple-900/50 shadow-[0_0_30px_rgba(168,85,247,0.05)]"
                : "bg-[#0A0A0A] border-[#1F1F1F]"
        )}>
            {/* Header */}
            <div className={cn(
                "flex h-[72px] items-center px-4",
                isCollapsed ? "justify-center" : "justify-between px-6"
            )}>
                {!isCollapsed && (
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
                )}

                <div className="flex items-center gap-1">
                    {!isCollapsed && <NotificationCenter />}
                    <button
                        onClick={onToggleCollapse}
                        className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Create Button */}
            <div className={cn("px-3 mb-6", isCollapsed ? "px-3" : "px-5")}>
                <CommandPalette
                    trigger={
                        <button
                            className={cn(
                                "flex items-center justify-center gap-3 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white/90 border border-white/5 transition-all h-12 rounded-xl group overflow-hidden",
                                isCollapsed ? "w-12 px-0" : "w-full px-4"
                            )}
                            title={isCollapsed ? "Create New" : ""}
                        >
                            <Plus className="h-5 w-5 text-white/70 shrink-0" />
                            {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">Create</span>}
                        </button>
                    }
                />
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 mb-6 overflow-y-auto no-scrollbar">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                    const badgeCount = "badgeKey" in item ? (counts[item.badgeKey as keyof typeof counts] as number) : 0;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={handleLinkClick}
                            title={isCollapsed ? item.name : ""}
                            className={cn(
                                "group flex items-center rounded-xl transition-all duration-200",
                                isCollapsed ? "justify-center p-3" : "justify-between px-4 py-3",
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
                                        "h-5 w-5 transition-colors shrink-0",
                                        isActive
                                            ? isHiddenMode ? "text-purple-400" : "text-white"
                                            : "text-[#888888] group-hover:text-white"
                                    )}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>}
                            </div>

                            {!isCollapsed && badgeCount > 0 && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg shadow-red-500/20">
                                    {badgeCount > 99 ? "99+" : badgeCount}
                                </span>
                            )}

                            {isCollapsed && badgeCount > 0 && (
                                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-[#0A0A0A]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-3 mt-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className={cn(
                            "rounded-2xl transition-all cursor-pointer group",
                            isCollapsed
                                ? "bg-transparent p-0 flex justify-center"
                                : "bg-[#131313] border border-white/5 p-1 hover:border-white/10"
                        )}>
                            <div className={cn(
                                "flex items-center rounded-xl transition-all group-hover:bg-white/5",
                                isCollapsed ? "p-1.5" : "gap-3 p-3"
                            )}>
                                <Avatar className="h-9 w-9 border border-white/10 shrink-0">
                                    <AvatarImage src={session?.user?.image || ""} />
                                    <AvatarFallback className="bg-[#1A1A1A] text-white text-xs font-bold">
                                        {getInitials(session?.user?.name || "User")}
                                    </AvatarFallback>
                                </Avatar>
                                {!isCollapsed && (
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white/90 truncate">
                                            {session?.user?.name || "User"}
                                        </p>
                                        <p className="text-[11px] text-[#555] truncate">
                                            Workspace Admin
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side="top"
                        align="end"
                        className="w-[260px] mb-2 bg-[#121212]/95 border-white/10 backdrop-blur-xl rounded-[16px] p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                    >
                        <div className="px-3 py-2.5 pb-2">
                            <p className="text-[16px] font-medium text-zinc-500 truncate leading-tight">
                                {session?.user?.email || "user@devkeep.com"}
                            </p>
                        </div>

                        <div className="space-y-0.5">
                            <Link href="/settings">
                                <DropdownMenuItem className="group gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                                    <Settings className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
                                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Settings</span>
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem className="group gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                                <HelpCircle className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
                                <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Get Help</span>
                            </DropdownMenuItem>
                        </div>

                        <div className="px-2 my-2.5">
                            <div className="h-px bg-white/[0.06] w-full" />
                        </div>

                        <div className="space-y-0.5">
                            <Link href="/subscription">
                                <DropdownMenuItem className="group gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                                    <Sparkles className="h-4 w-4 text-amber-400/80 group-hover:text-amber-400 transition-colors" />
                                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Upgrade Plan</span>
                                </DropdownMenuItem>
                            </Link>

                            <DropdownMenuItem
                                className="group gap-3 px-3 py-3 mt-1 rounded-xl cursor-pointer hover:bg-white/[0.03] transition-all"
                                onClick={() => signOut({ callbackUrl: "/" })}
                            >
                                <LogOut className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
                                <span className="text-sm font-bold text-white tracking-tight">Log out</span>
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
