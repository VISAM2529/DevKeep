"use client";

import {
    LiveKitRoom,
    VideoConference,
    GridLayout,
    ParticipantTile,
    RoomAudioRenderer,
    ControlBar,
    useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { useEffect, useState } from "react";
import { Track } from "livekit-client";
import { Loader2 } from "lucide-react";

interface VideoConferenceProps {
    roomId: string;
    username: string;
    onLeave: () => void;
}

export default function VideoConferenceComponent({ roomId, username, onLeave }: VideoConferenceProps) {
    const [token, setToken] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const resp = await fetch(
                    `/api/livekit/token?room=${roomId}&username=${username}`
                );
                const data = await resp.json();
                setToken(data.token);
            } catch (e) {
                console.error(e);
            }
        })();
    }, [roomId, username]);

    if (token === "") {
        return (
            <div className="flex flex-col items-center justify-center p-12 h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-sm text-center text-muted-foreground">Getting things ready...</p>
            </div>
        );
    }

    return (
        <LiveKitRoom
            video={true}
            audio={true}
            token={token}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            data-lk-theme="default"
            style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}
            onDisconnected={onLeave}
            className="rounded-lg overflow-hidden border border-border shadow-sm"
        >
            <VideoConference />
            <RoomAudioRenderer />
            <ControlBar />
        </LiveKitRoom>
    );
}

function MyVideoConference() {
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false },
    );
    return (
        <GridLayout tracks={tracks} style={{ height: 'calc(100% - var(--lk-control-bar-height))' }}>
            <ParticipantTile />
        </GridLayout>
    );
}
