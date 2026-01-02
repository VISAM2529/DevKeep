"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Settings, Users, UserPlus, Video } from "lucide-react";
import VideoConferenceComponent from "@/components/VideoConference";
import { MeetingNotesPanel } from "@/components/meeting/MeetingNotesPanel";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ProjectCard } from "@/components/projects/ProjectCard";
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
    const [community, setCommunity] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [isMeeting, setIsMeeting] = useState(false);

    const fetchDetails = useCallback(async () => {
        try {
            // Fetch community details
            const commRes = await fetch(`/api/communities/${params.id}`);
            if (!commRes.ok) throw new Error("Failed to fetch community");
            const commData = await commRes.json();
            setCommunity(commData);

            // Fetch community projects
            const projRes = await fetch(`/api/projects?communityId=${params.id}`);
            const projData = await projRes.json();

            if (projRes.ok) {
                setProjects(projData.projects || []);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [params.id]);

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
                        <h1 className="text-xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            {community.name}
                            <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] md:text-sm font-normal py-0 md:py-1">
                                {community.members.length} Members
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground max-w-2xl text-[11px] md:text-sm leading-relaxed">
                            {community.description}
                        </p>
                        <Badge variant="secondary" className="sm:hidden text-[10px] font-normal py-0">
                            {community.members.length} Members
                        </Badge>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button
                        variant={isMeeting ? "destructive" : "default"}
                        onClick={() => setIsMeeting(!isMeeting)}
                        className="h-9 gap-2 text-xs"
                    >
                        <Video className="h-3.5 w-3.5" />
                        {isMeeting ? "End Meeting" : "Meet"}
                    </Button>
                </div>
            </div>

            <Separator className="bg-border/40" />

            {/* Content Tabs */}
            {isMeeting ? (
                <div className="flex h-[calc(100vh-200px)] gap-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex-1 rounded-xl overflow-hidden border border-border/40 shadow-sm">
                        <VideoConferenceComponent
                            roomId={`community-${params.id}`}
                            username={session?.user?.name || "Member"}
                            onLeave={() => setIsMeeting(false)}
                        />
                    </div>
                    <MeetingNotesPanel communityId={params.id as string} />
                </div>
            ) : (
                <Tabs defaultValue="projects" className="flex-1 flex flex-col space-y-6">
                    <TabsList className="h-auto p-1 flex overflow-x-auto no-scrollbar justify-start bg-secondary/20 w-fit max-w-full">
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
                            <Link href={`/projects/new?communityId=${community._id}`}>
                                <Button size="sm" className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Project
                                </Button>
                            </Link>
                        </div>

                        {projects.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {projects.map((project) => (
                                    <ProjectCard key={project._id} project={project} />
                                ))}
                            </div>
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
            )}

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
