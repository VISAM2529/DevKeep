"use client";

import { cn } from "@/lib/utils";
import { useHiddenSpace } from "@/components/providers/HiddenSpaceProvider";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Settings, Users, UserPlus, Video, MessageSquare, FileText, LayoutGrid, List } from "lucide-react";
import VideoConferenceComponent from "@/components/VideoConference";
import { MeetingNotesPanel } from "@/components/meeting/MeetingNotesPanel";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectTable } from "@/components/projects/ProjectTable";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";
import { CommunityMemberModal } from "@/components/communities/CommunityMemberModal";
import { useSession } from "next-auth/react";
import { AttendanceWidget } from "@/components/communities/AttendanceWidget";
import { AttendanceAnalytics } from "@/components/communities/AttendanceAnalytics";
import { MyAttendanceHistory } from "@/components/communities/MyAttendanceHistory";

export default function CommunityDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const { isHiddenMode } = useHiddenSpace();
    const [community, setCommunity] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [isMeeting, setIsMeeting] = useState(false);
    const [view, setView] = useState<"grid" | "table">("grid");
    const [activeMeetingTab, setActiveMeetingTab] = useState<'none' | 'chat' | 'notes'>('none');

    const fetchDetails = useCallback(async () => {
        try {
            // Fetch community details
            const commRes = await fetch(`/api/communities/${params.id}`);
            if (!commRes.ok) throw new Error("Failed to fetch community");
            const commData = await commRes.json();
            setCommunity(commData);

            // Fetch community projects
            const projRes = await fetch(`/api/projects?communityId=${params.id}&hidden=${isHiddenMode}`);
            const projData = await projRes.json();

            if (projRes.ok) {
                setProjects(projData.projects || []);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [params.id, isHiddenMode]);

    useEffect(() => {
        if (params.id) {
            fetchDetails();
        }
    }, [params.id, fetchDetails]);

    if (isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!community) {
        return <div className="p-8">Community not found</div>;
    }

    return (
        <div className="h-full flex flex-col space-y-6 p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Button
                    variant="ghost"
                    className="w-fit -ml-2 text-muted-foreground hover:text-foreground h-9 text-xs md:text-sm"
                    onClick={() => router.push("/communities")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Communities
                </Button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className={cn(
                            "text-xl md:text-3xl font-bold tracking-tight flex items-center gap-3",
                            isHiddenMode ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600" : "text-foreground"
                        )}>
                            {community.name}
                            <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] md:text-sm font-normal py-0 md:py-1">
                                {community.members.length} Members
                            </Badge>
                        </h1>
                        <p className={cn(
                            "max-w-2xl text-[11px] md:text-sm leading-relaxed",
                            isHiddenMode ? "text-purple-200/60" : "text-muted-foreground"
                        )}>
                            {community.description}
                        </p>
                        <Badge variant="secondary" className="sm:hidden text-[10px] font-normal py-0">
                            {community.members.length} Members
                        </Badge>
                    </div>
                </div>

                <div className="flex justify-end items-center gap-2">
                    {isMeeting && (
                        <div className="flex items-center gap-1 bg-secondary/20 rounded-lg p-1 mr-2">
                            <Button
                                variant={activeMeetingTab === 'chat' ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setActiveMeetingTab(activeMeetingTab === 'chat' ? 'none' : 'chat')}
                                className="h-8 gap-2 text-xs"
                            >
                                <MessageSquare className="h-3.5 w-3.5" />
                                Chat
                            </Button>
                            <Button
                                variant={activeMeetingTab === 'notes' ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setActiveMeetingTab(activeMeetingTab === 'notes' ? 'none' : 'notes')}
                                className="h-8 gap-2 text-xs"
                            >
                                <FileText className="h-3.5 w-3.5" />
                                Notes
                            </Button>
                        </div>
                    )}
                    <Button
                        variant={isMeeting ? "destructive" : "default"}
                        onClick={async () => {
                            if (isMeeting) {
                                setIsMeeting(false);
                                setActiveMeetingTab('none');
                                try {
                                    fetch("/api/meeting/end", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ communityId: params.id }),
                                    });
                                    setCommunity((prev: any) => prev ? ({ ...prev, isMeetingActive: false }) : null);
                                } catch (err) {
                                    console.error("Failed to end meeting", err);
                                }
                            } else {
                                if (community?.isMeetingActive) {
                                    setIsMeeting(true);
                                } else {
                                    setIsMeeting(true);
                                    try {
                                        fetch("/api/notifications/meeting", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ communityId: params.id }),
                                        });
                                        setCommunity((prev: any) => prev ? ({ ...prev, isMeetingActive: true }) : null);
                                    } catch (err) {
                                        console.error("Failed to notify meeting start", err);
                                    }
                                }
                            }
                        }}
                        className={`h-9 gap-2 text-xs ${!isMeeting && community?.isMeetingActive ? "bg-green-600 hover:bg-green-700 text-white" : ""
                            }`}
                    >
                        <Video className="h-3.5 w-3.5" />
                        {isMeeting ? "End Meeting" : (community?.isMeetingActive ? "Join Meeting" : "Meet")}
                    </Button>
                </div>
            </div>

            {/* Birthday Alert */}
            {
                (() => {
                    const today = new Date();
                    const birthdayMembers = community.members.filter((member: any) => {
                        if (!member.userId.birthDate) return false;
                        const bdate = new Date(member.userId.birthDate);
                        return bdate.getDate() === today.getDate() && bdate.getMonth() === today.getMonth();
                    });

                    // Also check owner
                    if (community.ownerId.birthDate) {
                        const bdate = new Date(community.ownerId.birthDate);
                        if (bdate.getDate() === today.getDate() && bdate.getMonth() === today.getMonth()) {
                            // Check if owner is already in members list (usually not populated as member object)
                            const exists = birthdayMembers.some((m: any) => m.userId._id === community.ownerId._id);
                            if (!exists) {
                                birthdayMembers.push({ userId: community.ownerId });
                            }
                        }
                    }

                    if (birthdayMembers.length > 0) {
                        return (
                            <div className="bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 border border-pink-500/30 rounded-xl p-4 flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
                                <div className="h-10 w-10 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
                                    <span className="text-xl">🎂</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-pink-500">Party Time!</h3>
                                    <p className="text-sm text-foreground/80">
                                        It's <span className="font-bold text-pink-400">{birthdayMembers.map((m: any) => m.userId.name).join(", ")}</span>'s birthday today! Wish them a great day! 🎉
                                    </p>
                                </div>
                            </div>
                        )
                    }
                    return null;
                })()
            }

            <Separator className="bg-border/40" />

            {/* Content Tabs */}
            {
                isMeeting ? (
                    <div className="flex h-[calc(100vh-200px)] gap-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className={`transition-all duration-300 rounded-xl overflow-hidden border border-border/40 shadow-sm ${activeMeetingTab === 'none' ? 'flex-1' : 'flex-[2]'
                            }`}>
                            <VideoConferenceComponent
                                roomId={`community-${params.id}`}
                                username={session?.user?.name || "Member"}
                                onLeave={() => setIsMeeting(false)}
                            />
                        </div>
                        {activeMeetingTab !== 'none' && (
                            <div className="flex-1 min-w-[320px] max-w-[400px] animate-in slide-in-from-right-4 duration-300">
                                {activeMeetingTab === 'chat' ? (
                                    <ChatInterface
                                        communityId={params.id as string}
                                        meetingId={community?.activeMeetingId}
                                        className="h-full"
                                    />
                                ) : (
                                    <MeetingNotesPanel communityId={params.id as string} />
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <Tabs defaultValue="projects" className="flex-1 flex flex-col space-y-6">
                        <TabsList className={cn(
                            "h-auto p-1 flex overflow-x-auto no-scrollbar justify-start w-fit max-w-full",
                            isHiddenMode ? "bg-black/40 border border-purple-500/20" : "bg-secondary/20"
                        )}>
                            <TabsTrigger value="projects" className="py-1.5 md:py-2 text-xs md:text-sm px-3 md:px-4 whitespace-nowrap shrink-0">Projects</TabsTrigger>
                            <TabsTrigger value="chat" className="gap-2 py-1.5 md:py-2 text-xs md:text-sm px-3 md:px-4 whitespace-nowrap shrink-0">
                                Discussion
                                {community.unreadCount > 0 && (
                                    <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-[8px] md:text-[10px] rounded-full">
                                        {community.unreadCount}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="members" className="py-1.5 md:py-2 text-xs md:text-sm px-3 md:px-4 whitespace-nowrap shrink-0">Members</TabsTrigger>
                            <TabsTrigger value="attendance" className="py-1.5 md:py-2 text-xs md:text-sm px-3 md:px-4 whitespace-nowrap shrink-0">Attendance</TabsTrigger>
                        </TabsList>

                        <TabsContent value="projects" className="space-y-6 outline-none">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Community Projects</h3>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-secondary/20 rounded-lg p-1 border border-white/5">
                                        <Button
                                            variant={view === "grid" ? "secondary" : "ghost"}
                                            size="icon"
                                            className="h-8 w-8 rounded-md"
                                            onClick={() => setView("grid")}
                                        >
                                            <LayoutGrid className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant={view === "table" ? "secondary" : "ghost"}
                                            size="icon"
                                            className="h-8 w-8 rounded-md"
                                            onClick={() => setView("table")}
                                        >
                                            <List className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Link href={`/projects/new?communityId=${community._id}`}>
                                        <Button size="sm" className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Add Project
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {projects.length > 0 ? (
                                view === "grid" ? (
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {projects.map((project) => (
                                            <ProjectCard key={project._id} project={project} />
                                        ))}
                                    </div>
                                ) : (
                                    <ProjectTable projects={projects} />
                                )
                            ) : (
                                <div className="text-center py-12 border border-dashed border-border/40 rounded-xl bg-card/30">
                                    <p className="text-muted-foreground">No projects in this community yet.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="chat" className="outline-none h-full min-h-[550px] md:min-h-0">
                            <ChatInterface communityId={community._id} />
                        </TabsContent>

                        <TabsContent value="members" className="outline-none">
                            <div className="border border-border/40 rounded-xl bg-card overflow-hidden">
                                <div className="p-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
                                    <span className="font-medium text-sm">Members Pool</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-2"
                                        onClick={() => setIsMemberModalOpen(true)}
                                    >
                                        <UserPlus className="h-3.5 w-3.5" />
                                        Manage Members
                                    </Button>
                                </div>
                                <div className="divide-y divide-border/20">
                                    {community.members.map((member: any) => (
                                        <div key={member._id} className="flex items-center justify-between p-4 hover:bg-muted/5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                                                    {getInitials(member.userId.name)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-foreground">{member.userId.name}</p>
                                                    <p className="text-xs text-muted-foreground">{member.userId.email}</p>
                                                </div>
                                            </div>
                                            <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                                                {member.role}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>



                        <TabsContent value="attendance" className="space-y-6 outline-none">
                            {(() => {
                                const isOwner = community.createdBy === session?.user?.id;
                                const currentMember = community.members.find(
                                    (m: any) => m.userId._id === session?.user?.id || m.userId === session?.user?.id
                                );
                                const isAdmin = currentMember?.role?.toLowerCase() === "admin";

                                // Debug logging
                                console.log('Attendance Tab Debug:', {
                                    userId: session?.user?.id,
                                    communityCreatedBy: community.createdBy,
                                    isOwner,
                                    currentMember,
                                    memberRole: currentMember?.role,
                                    isAdmin,
                                    shouldShowAnalytics: isOwner || isAdmin
                                });

                                if (isOwner || isAdmin) {
                                    // Admin/Owner view: Show both widget and analytics
                                    return (
                                        <div className="space-y-6">
                                            <AttendanceWidget communityId={community._id} />
                                            <AttendanceAnalytics communityId={community._id} />
                                        </div>
                                    );
                                } else {
                                    // Regular member view: Show widget and personal history
                                    return (
                                        <div className="space-y-6">
                                            <AttendanceWidget communityId={community._id} />
                                            <MyAttendanceHistory communityId={community._id} />
                                        </div>
                                    );
                                }
                            })()}
                        </TabsContent>
                    </Tabs>
                )
            }

            <CommunityMemberModal
                isOpen={isMemberModalOpen}
                onClose={() => setIsMemberModalOpen(false)}
                communityId={community._id}
                ownerId={community.ownerId._id || community.ownerId} // Handle populated vs unpopulated
                currentUserId={session?.user?.id || ""}
                members={community.members}
                onUpdate={fetchDetails}
            />
        </div >
    );
}
