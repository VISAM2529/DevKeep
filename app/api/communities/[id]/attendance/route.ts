import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Community from "@/models/Community";
import { format } from "date-fns";

// POST /api/communities/[id]/attendance - Clock In/Out
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Verify community membership
        const community = await Community.findById(id);
        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        const isMember = community.members.some(
            (m: any) => m.userId.toString() === session.user.id
        );

        if (!isMember) {
            return NextResponse.json({ error: "Not a community member" }, { status: 403 });
        }

        const today = format(new Date(), "yyyy-MM-dd");

        // Check for active session
        const activeSession = await Attendance.findOne({
            userId: session.user.id,
            communityId: id,
            status: "active",
        });

        if (activeSession) {
            // Clock Out
            const clockOutTime = new Date();
            const hoursWorked = (clockOutTime.getTime() - activeSession.clockIn.getTime()) / (1000 * 60 * 60);

            activeSession.clockOut = clockOutTime;
            activeSession.totalHours = parseFloat(hoursWorked.toFixed(2));
            activeSession.status = "completed";
            await activeSession.save();

            // Trigger Notification for Owner
            if (session.user.id !== community.ownerId.toString()) {
                const Notification = (await import("@/models/Notification")).default;
                await Notification.create({
                    recipientId: community.ownerId,
                    senderId: session.user.id,
                    type: "community_event",
                    title: "Member Clocked Out",
                    message: `${session.user.name} clocked out from ${community.name}`,
                    link: `/communities/${id}`,
                    communityId: id,
                });
            }

            return NextResponse.json({
                action: "clockOut",
                attendance: activeSession,
                message: `Clocked out successfully. Total hours: ${activeSession.totalHours}`,
            });
        } else {
            // Clock In
            const newAttendance = await Attendance.create({
                userId: session.user.id,
                communityId: id,
                clockIn: new Date(),
                date: today,
                status: "active",
            });

            await newAttendance.populate("userId", "name email image");

            // Trigger Notification for Owner
            if (session.user.id !== community.ownerId.toString()) {
                const Notification = (await import("@/models/Notification")).default;
                await Notification.create({
                    recipientId: community.ownerId,
                    senderId: session.user.id,
                    type: "community_event",
                    title: "Member Clocked In",
                    message: `${session.user.name} clocked in to ${community.name}`,
                    link: `/communities/${id}`,
                    communityId: id,
                });
            }

            return NextResponse.json({
                action: "clockIn",
                attendance: newAttendance,
                message: "Clocked in successfully",
            });
        }
    } catch (error: any) {
        console.error("Attendance error:", error);
        return NextResponse.json({ error: "Failed to process attendance" }, { status: 500 });
    }
}

// GET /api/communities/[id]/attendance - Fetch attendance records
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        await connectDB();

        // Verify community membership
        const community = await Community.findById(id);
        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        const isMember = community.members.some(
            (m: any) => m.userId.toString() === session.user.id
        );

        if (!isMember) {
            return NextResponse.json({ error: "Not a community member" }, { status: 403 });
        }

        // Build query
        const query: any = { communityId: id };

        if (userId) {
            query.userId = userId;
        }

        if (startDate && endDate) {
            query.date = { $gte: startDate, $lte: endDate };
        }

        const attendanceRecords = await Attendance.find(query)
            .populate("userId", "name email image")
            .sort({ clockIn: -1 })
            .limit(100);

        return NextResponse.json(attendanceRecords);
    } catch (error: any) {
        console.error("Fetch attendance error:", error);
        return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
    }
}
