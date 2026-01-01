import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Community from "@/models/Community";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";

// GET /api/communities/[id]/attendance/analytics - Fetch attendance analytics
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
        const period = searchParams.get("period") || "weekly"; // daily, weekly, monthly
        const userId = searchParams.get("userId");

        await connectDB();

        // Verify community membership and admin status
        const community = await Community.findById(id);
        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        const isOwner = community.ownerId.toString() === session.user.id;
        const member = community.members.find(
            (m: any) => m.userId.toString() === session.user.id
        );

        const isAdmin = isOwner || member?.role === "admin";

        // If not admin and no userId specified, default to current user
        // This allows members to see their own data
        let targetUserId = userId;
        if (!isAdmin && !userId) {
            targetUserId = session.user.id;
        }

        // Only admins can view other users' data or all users
        if (!isAdmin && userId && userId !== session.user.id) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        // Calculate date range based on period
        const now = new Date();
        let startDate: string, endDate: string;

        switch (period) {
            case "daily":
                startDate = format(now, "yyyy-MM-dd");
                endDate = format(now, "yyyy-MM-dd");
                break;
            case "weekly":
                startDate = format(startOfWeek(now), "yyyy-MM-dd");
                endDate = format(endOfWeek(now), "yyyy-MM-dd");
                break;
            case "monthly":
                startDate = format(startOfMonth(now), "yyyy-MM-dd");
                endDate = format(endOfMonth(now), "yyyy-MM-dd");
                break;
            default:
                startDate = format(startOfWeek(now), "yyyy-MM-dd");
                endDate = format(endOfWeek(now), "yyyy-MM-dd");
        }

        // Build query
        const query: any = {
            communityId: id,
            date: { $gte: startDate, $lte: endDate },
            status: "completed",
        };

        if (targetUserId) {
            query.userId = targetUserId;
        }

        // Fetch attendance records
        const records = await Attendance.find(query)
            .populate("userId", "name email image")
            .sort({ date: -1 });

        // Aggregate data by user
        const userStats = records.reduce((acc: any, record: any) => {
            const uid = record.userId._id.toString();
            if (!acc[uid]) {
                acc[uid] = {
                    user: record.userId,
                    totalHours: 0,
                    daysPresent: 0,
                    records: [],
                };
            }
            acc[uid].totalHours += record.totalHours;
            acc[uid].daysPresent += 1;
            acc[uid].records.push({
                date: record.date,
                clockIn: record.clockIn,
                clockOut: record.clockOut,
                hours: record.totalHours,
            });
            return acc;
        }, {});

        // Convert to array and calculate averages
        const analytics = Object.values(userStats).map((stat: any) => ({
            user: stat.user,
            totalHours: parseFloat(stat.totalHours.toFixed(2)),
            daysPresent: stat.daysPresent,
            averageHoursPerDay: parseFloat((stat.totalHours / stat.daysPresent).toFixed(2)),
            records: stat.records,
        }));

        return NextResponse.json({
            period,
            startDate,
            endDate,
            analytics,
            summary: {
                totalMembers: analytics.length,
                totalHours: parseFloat(
                    analytics.reduce((sum: number, a: any) => sum + a.totalHours, 0).toFixed(2)
                ),
            },
        });
    } catch (error: any) {
        console.error("Analytics error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
