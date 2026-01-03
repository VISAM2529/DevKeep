import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Community from "@/models/Community";
import Notification from "@/models/Notification";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Update last seen
        user.lastSeen = new Date();

        // Birthday Logic
        if (user.birthDate) {
            const today = new Date();
            const birthDate = new Date(user.birthDate);
            const currentYear = today.getFullYear();

            // Check if today is birthday (month and day match)
            if (
                today.getMonth() === birthDate.getMonth() &&
                today.getDate() === birthDate.getDate()
            ) {
                // Check if we haven't notified this year yet
                if (user.lastBirthdayNotificationYear !== currentYear) {

                    // console.log(`Triggering birthday notifications for ${user.name}`);

                    // Find all communities where user is a member
                    const communities = await Community.find({
                        $or: [
                            { "members.userId": user._id },
                            { ownerId: user._id }
                        ]
                    });

                    // Collect all unique member IDs to notify
                    const memberIdsToNotify = new Set<string>();

                    communities.forEach(community => {
                        // Add owner
                        if (community.ownerId.toString() !== user._id.toString()) {
                            memberIdsToNotify.add(community.ownerId.toString());
                        }

                        // Add members
                        community.members.forEach((member: any) => {
                            if (member.userId.toString() !== user._id.toString()) {
                                memberIdsToNotify.add(member.userId.toString());
                            }
                        });
                    });

                    // Create notifications
                    const notifications = Array.from(memberIdsToNotify).map(recipientId => ({
                        recipientId,
                        type: "birthday_wish",
                        title: `🎂 Happy Birthday ${user.name}!`,
                        message: `It's ${user.name}'s birthday today! Wish them a great day!`,
                        senderId: user._id,
                        read: false,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }));

                    if (notifications.length > 0) {
                        await Notification.insertMany(notifications);
                    }

                    // Mark as notified for this year
                    user.lastBirthdayNotificationYear = currentYear;
                }
            }
        }

        await user.save();

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error("Pulse error:", error);
        return NextResponse.json(
            { error: "Failed to update pulse" },
            { status: 500 }
        );
    }
}

