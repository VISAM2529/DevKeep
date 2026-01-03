"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    FolderKanban,
    Lock,
    Terminal,
    FileText,
    Settings,
    Plus,
    Search,
} from "lucide-react";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import { useHiddenSpace } from "@/components/providers/HiddenSpaceProvider";

interface CommandPaletteProps {
    trigger?: React.ReactNode;
}

export function CommandPalette({ trigger }: CommandPaletteProps) {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const { toggleHiddenMode } = useHiddenSpace();
    const [search, setSearch] = React.useState("");

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && search.length >= 4) {
            // Try to toggle hidden mode with the search term as password
            const success = await toggleHiddenMode(search);
            if (success) {
                setOpen(false);
                setSearch("");
            }
        }
    };

    return (
        <>
            <div onClick={() => setOpen(true)}>
                {trigger || (
                    <button
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-input bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full text-sm"
                    >
                        <Search className="h-4 w-4" />
                        <span className="flex-1 text-left">Search...</span>
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </button>
                )}
            </div>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Type a command or search..."
                    value={search}
                    onValueChange={setSearch}
                    onKeyDown={handleKeyDown}
                />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Suggestions">
                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/projects"))}>
                            <FolderKanban className="mr-2 h-4 w-4" />
                            <span>Projects</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/credentials"))}>
                            <Lock className="mr-2 h-4 w-4" />
                            <span>Credentials</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/commands"))}>
                            <Terminal className="mr-2 h-4 w-4" />
                            <span>Commands</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/notes"))}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Notes</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Actions">
                        <CommandItem onSelect={() => runCommand(() => router.push("/projects/new"))}>
                            <Plus className="mr-2 h-4 w-4" />
                            <span>New Project</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                            <CommandShortcut>⌘S</CommandShortcut>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
