// import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/lib/auth";
// import connectDB from "@/lib/mongodb";
// import Community from "@/models/Community";
// import User from "@/models/User";
// import { SUBSCRIPTION_PLANS } from "@/config/subscriptions";

// export async function GET(req: Request) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session || !session.user?.id) {
//             return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//         }

//         await connectDB();

//         const { searchParams } = new URL(req.url);
//         const hiddenQuery = searchParams.get("hidden");
//         const isHiddenFilter = hiddenQuery === "true" ? true : { $ne: true };

//         // 1. Accepted/Owned Communities
//         const communities = await Community.find({
//             $and: [
//                 { isHidden: isHiddenFilter },
//                 {
//                     $or: [
//                         { ownerId: session.user.id },
//                         {
//                             members: {
//                                 $elemMatch: {
//                                     userId: session.user.id,
//                                     accepted: { $ne: false } // Accepted or undefined (legacy)
//                                 }
//                             }
//                         }
//                     ]
//                 }
//             ]
//         }).populate("ownerId", "name email").populate("members.userId", "name email image").sort({ createdAt: -1 });

//         // 2. Pending Invitations
//         const pendingInvitations = await Community.find({
//             isHidden: isHiddenFilter,
//             ownerId: { $ne: session.user.id }, // Exclude communities owned by the user
//             members: {
//                 $elemMatch: {
//                     userId: session.user.id,
//                     accepted: false
//                 }
//             }
//         }).populate("ownerId", "name email").sort({ createdAt: -1 });

//         return NextResponse.json({ communities, pendingInvitations });
//     } catch (error: any) {
//         console.error("GET /api/communities error:", error);
//         return NextResponse.json({ error: "Failed to fetch communities" }, { status: 500 });
//     }
// }

// export async function POST(req: Request) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session || !session.user?.id) {
//             return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//         }

//         const { name, description, icon, isHidden } = await req.json();

//         if (!name) {
//             return NextResponse.json({ error: "Community name is required" }, { status: 400 });
//         }

//         await connectDB();

//         const newCommunity = await Community.create({
//             ownerId: session.user.id,
//             name,
//             description,
//             icon,
//             members: [
//                 {
//                     userId: session.user.id,
//                     role: "admin",
//                     accepted: true,
//                     joinedAt: new Date(),
//                 },
//             ],
//             isHidden: isHidden || false,
//         });

//         return NextResponse.json(newCommunity, { status: 201 });
//     } catch (error: any) {
//         console.error("POST /api/communities error:", error);
//         return NextResponse.json({ error: error.message || "Failed to create community" }, { status: 500 });
//     }
// }





// app/api/communities/route.ts  (example starting point + limit enforcement)

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Community from '@/models/Community';
import { checkLimit } from '@/lib/subscription';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  // description?: string,
  // other fields...
});

// GET /api/communities - list communities + invitations
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const hiddenQuery = searchParams.get('hidden');
    const isHiddenFilter = hiddenQuery === 'true' ? true : { $ne: true };

    // accepted / owned communities
    const communities = await Community.find({
      $and: [
        { isHidden: isHiddenFilter },
        {
          $or: [
            { ownerId: session.user.id },
            {
              members: {
                $elemMatch: {
                  userId: session.user.id,
                  accepted: { $ne: false }, // accepted or unspecified
                },
              },
            },
          ],
        },
      ],
    })
      .populate('ownerId', 'name email')
      .populate('members.userId', 'name email image')
      .sort({ createdAt: -1 });

    // pending invitations
    const pendingInvitations = await Community.find({
      isHidden: isHiddenFilter,
      ownerId: { $ne: session.user.id },
      members: {
        $elemMatch: {
          userId: session.user.id,
          accepted: false,
        },
      },
    })
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ communities, pendingInvitations }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/communities error:', error);
    return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;

    // Enforce community limit
    const limitCheck = await checkLimit(userId, 'communities');

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: limitCheck.reason ||
            `Community limit reached (${limitCheck.current}/${limitCheck.limit}) on ${limitCheck.planName} plan.`,
          current: limitCheck.current,
          max: limitCheck.limit,
          plan: limitCheck.planName,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = createSchema.parse(body);

    const newCommunity = new Community({
      ...validated,
      ownerId: userId,              // adjust to your actual owner field
      members: [{ userId, role: 'owner' }],  // or [] + add owner separately
      // other defaults...
    });

    await newCommunity.save();

    return NextResponse.json({ success: true, community: newCommunity }, { status: 201 });
  } catch (error) {
    // zod or other error handling...
    console.error(error);
    return NextResponse.json({ error: 'Failed to create community' }, { status: 500 });
  }
}