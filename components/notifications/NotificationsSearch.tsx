"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

interface NotificationsSearchProps {
    onSearch: (query: string) => void;
}

export function NotificationsSearch({ onSearch }: NotificationsSearchProps) {
    const [value, setValue] = useState("");

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(value);
        }, 300);

        return () => clearTimeout(timer);
    }, [value, onSearch]);

    return (
        <div className="relative w-full max-w-sm">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                <Search className="h-4 w-4" />
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Search notifications..."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-12 pr-10 py-2.5 text-sm text-white placeholder:text-zinc-500/60 focus:outline-none focus:ring-2 focus:ring-white/5 focus:border-white/20 focus:shadow-[0_0_12px_rgba(255,255,255,0.03)] transition-all duration-200"
            />
            {value && (
                <button
                    onClick={() => setValue("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
