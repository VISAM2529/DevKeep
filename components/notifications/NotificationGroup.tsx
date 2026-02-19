"use client";

import { ReactNode } from "react";

interface NotificationGroupProps {
    title: string;
    children: ReactNode;
}

export function NotificationGroup({ title, children }: NotificationGroupProps) {
    return (
        <div className="space-y-1">
            <div className="sticky top-[132px] sm:top-[76px] z-10 bg-black/80 backdrop-blur-md px-6 py-3 border-b border-white/[0.04]">
                <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    {title}
                </h3>
            </div>
            <div className="divide-y divide-white/[0.04]">
                {children}
            </div>
        </div>
    );
}
