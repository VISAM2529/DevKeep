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
    Users
} from "lucide-react";
import { CommandPalette } from "@/components/CommandPalette";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: FolderKanban },
    { name: "Communities", href: "/communities", icon: Users },
    { name: "Identity Vault", href: "/credentials", icon: Lock },
    { name: "Snippets", href: "/commands", icon: Terminal },
    { name: "Documentation", href: "/notes", icon: FileText },
];

interface SidebarProps {
    onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const handleLinkClick = () => {
        if (onClose) onClose();
    };

    return (
        <div className="flex h-full w-[280px] flex-col border-r border-[#1F1F1F] bg-[#0A0A0A] text-[#EDEDED]">
            {/* Logo */}
            <div className="flex h-[72px] items-center px-6">
                <div className="flex items-center gap-3">
                    <Zap className="h-6 w-6 text-white text-opacity-80 fill-current" />
                    <span className="text-xl font-bold tracking-tight text-white/90">DevKeep</span>
                </div>
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
            <nav className="flex-1 space-y-1 px-3">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={handleLinkClick}
                            className={cn(
                                "group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "text-white"
                                    : "text-[#888888] hover:text-white hover:bg-[#1A1A1A]"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "h-5 w-5 transition-colors",
                                    isActive ? "text-white" : "text-[#888888] group-hover:text-white"
                                )}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

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
