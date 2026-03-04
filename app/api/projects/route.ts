// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import connectDB from "@/lib/mongodb";
// import Project from "@/models/Project";
// import mongoose from "mongoose";
// import { z } from "zod";
// //sample
// const projectSchema = z.object({
//     name: z.string().min(1, "Project name is required"),
//     description: z.string().optional(),
//     techStack: z.array(z.string()).optional(),
//     repositoryUrl: z.string().url().optional().or(z.literal("")),
//     liveUrl: z.string().url().optional().or(z.literal("")),
//     environment: z.enum(["Local", "Staging", "Production"]).optional(),
//     status: z.enum(["Active", "Archived"]).optional(),
//     logo: z.string().optional(),
//     banner: z.string().optional(),
//     communityId: z.string().optional(),
//     isHidden: z.boolean().optional(),
// });

// // GET /api/projects - List all projects for authenticated user
// export async function GET(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);

//         if (!session?.user?.id) {
//             return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//         }

//         await connectDB();

//         const { searchParams } = new URL(req.url);
//         const status = searchParams.get("status");
//         const environment = searchParams.get("environment");
//         const communityIdQuery = searchParams.get("communityId");
//         const hiddenQuery = searchParams.get("hidden");
//         const userEmail = session.user.email?.toLowerCase() || "";

//         // Build base query filters
//         const filters: any = {};
//         if (status) filters.status = status;
//         if (environment) filters.environment = environment;
//         if (communityIdQuery) filters.communityId = communityIdQuery;

//         // Hidden Space Logic
//         // If hidden=true, show ONLY hidden projects
//         // If hidden!=true (default), show ONLY visible projects (false or undefined)
//         if (hiddenQuery === "true") {
//             filters.isHidden = true;
//         } else {
//             filters.isHidden = { $ne: true };
//         }

//         // Get unified access filter
//         const { getProjectAccessFilter } = await import("@/lib/auth");
//         const accessFilter = await getProjectAccessFilter(session.user.id, userEmail);

//         // 1. All accessible projects (Owned, Shared, Inherited)
//         const allAccessibleProjects = await Project.find({
//             ...accessFilter,
//             ...filters
//         })
//             .populate("userId", "email name")
//             .sort({ createdAt: -1 });

//         // Split for frontend categorization if needed, though they can be combined
//         const ownedProjects = allAccessibleProjects.filter(p => p.userId._id.toString() === session.user.id);
//         const sharedProjects = allAccessibleProjects.filter(p => p.userId._id.toString() !== session.user.id);

//         // 3. Pending invitations (Still need explicit query as they aren't "accessible" yet)
//         const pendingInvitations = await Project.find({
//             userId: { $ne: session.user.id }, // Exclude projects owned by the user
//             "sharedWith": {
//                 $elemMatch: {
//                     email: userEmail,
//                     accepted: false
//                 }
//             },
//             ...filters
//         })
//             .populate("userId", "email name")
//             .sort({ createdAt: -1 });

//         return NextResponse.json({
//             ownedProjects,
//             sharedProjects,
//             pendingInvitations,
//             projects: allAccessibleProjects
//         }, { status: 200 });
//     } catch (error: any) {
//         console.error("Get projects error:", error);
//         return NextResponse.json(
//             { error: "Failed to fetch projects" },
//             { status: 500 }
//         );
//     }
// }

// // POST /api/projects - Create new project
// export async function POST(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);

//         if (!session?.user?.id) {
//             return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//         }

//         const body = await req.json();
//         const validatedData = projectSchema.parse(body);

//         await connectDB();

//         // 1. If community member, verify admin/owner status
//         if (validatedData.communityId) {
//             const Community = (await import("@/models/Community")).default;
//             const community = await Community.findById(validatedData.communityId);
//             if (!community) {
//                 return NextResponse.json({ error: "Community not found" }, { status: 404 });
//             }

//             const isCommunityAdmin = community.members.some(
//                 (m: any) => m.userId.toString() === session.user.id && m.role === "admin"
//             ) || community.ownerId.toString() === session.user.id;

//             if (!isCommunityAdmin) {
//                 return NextResponse.json({ error: "Only community admins can create projects in this community" }, { status: 403 });
//             }
//         }

//         const project = await Project.create({
//             ...validatedData,
//             userId: session.user.id,
//         });

//         // Log Activity
//         const { logActivity } = await import("@/lib/activity");
//         await logActivity({
//             projectId: project._id.toString(),
//             userId: session.user.id,
//             userName: session.user.name || "Member",
//             action: `created the project: ${project.name}`,
//             type: "system"
//         });

//         return NextResponse.json({ project }, { status: 201 });
//     } catch (error: any) {
//         if (error instanceof z.ZodError) {
//             return NextResponse.json(
//                 { error: error.errors[0].message },
//                 { status: 400 }
//             );
//         }

//         console.error("Create project error:", error);
//         return NextResponse.json(
//             { error: "Failed to create project" },
//             { status: 500 }
//         );
//     }
// }






// app/api/projects/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // ← your NextAuth config file
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { checkLimit } from '@/lib/subscription';

// GET /api/projects - list projects for authenticated user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const environment = searchParams.get('environment');
    const communityIdQuery = searchParams.get('communityId');
    const hiddenQuery = searchParams.get('hidden');
    const userEmail = session.user.email?.toLowerCase() || '';

    // Build base query filters
    const filters: any = {};
    if (status) filters.status = status;
    if (environment) filters.environment = environment;
    if (communityIdQuery) filters.communityId = communityIdQuery;

    // Hidden Space Logic
    // If hidden=true, show ONLY hidden projects
    // If hidden!=true (default), show ONLY visible projects (false or undefined)
    if (hiddenQuery === 'true') {
      filters.isHidden = true;
    } else {
      filters.isHidden = { $ne: true };
    }

    // Get unified access filter
    const { getProjectAccessFilter } = await import('@/lib/auth');
    const accessFilter = await getProjectAccessFilter(
      session.user.id,
      userEmail
    );

    // 1. All accessible projects (Owned, Shared, Inherited)
    const allAccessibleProjects = await Project.find({
      ...accessFilter,
      ...filters,
    })
      .populate('userId', 'email name')
      .sort({ createdAt: -1 });

    const ownedProjects = allAccessibleProjects.filter(
      (p: any) => p.userId._id.toString() === session.user.id
    );
    const sharedProjects = allAccessibleProjects.filter(
      (p: any) => p.userId._id.toString() !== session.user.id
    );

    // 3. Pending invitations (Still need explicit query as they aren't "accessible" yet)
    const pendingInvitations = await Project.find({
      userId: { $ne: session.user.id },
      sharedWith: {
        $elemMatch: {
          email: userEmail,
          accepted: false,
        },
      },
      ...filters,
    })
      .populate('userId', 'email name')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        ownedProjects,
        sharedProjects,
        pendingInvitations,
        projects: allAccessibleProjects,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  try {
    // 1. Authenticate user via NextAuth
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Connect to DB (only once per request)
    await connectDB();

    // 3. Check subscription limit
    const limitCheck = await checkLimit(userId, 'projects');

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            limitCheck.reason ||
            `You've reached your project limit (${limitCheck.current}/${limitCheck.limit}) on the ${limitCheck.planName} plan.`,
          current: limitCheck.current,
          max: limitCheck.limit,
          plan: limitCheck.planName,
        },
        { status: 403 }
      );
    }

    // 4. Parse request body
    const body = await request.json();

    // Optional: Add basic validation here (or use Zod schema)
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Project name is required' },
        { status: 400 }
      );
    }

    // 5. Create project – use correct field names from your schema
    const newProject = new Project({
      ...body,
      userId: userId,           // ← matches your actual schema (owner)
      sharedWith: [],           // default empty array
      // communityId: body.communityId || null,   // uncomment if needed
      // other defaults or required fields...
    });

    await newProject.save();

    // 6. Success response
    return NextResponse.json(
      { success: true, project: newProject },
      { status: 201 }
    );
  } catch (error) {
    console.error('Project creation error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}