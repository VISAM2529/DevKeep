import mongoose from "mongoose";
import Community from "@/models/Community";

/**
 * Generates a MongoDB query for projects that a user has access to.
 * Includes owned projects, explicitly shared projects (accepted),
 * and projects belonging to communities where the user is an owner or admin.
 */
export async function getProjectAccessFilter(userId: string, userEmail: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const lowercaseEmail = userEmail.toLowerCase();

    // 1. Find all communities where user is owner or admin
    const adminCommunities = await Community.find({
        $or: [
            { ownerId: userObjectId },
            { "members": { $elemMatch: { userId: userObjectId, role: "admin" } } }
        ]
    }).select("_id");

    const communityIds = adminCommunities.map(c => c._id);

    // 2. Build the $or query for Projects
    return {
        $or: [
            { userId: userObjectId }, // Owned
            { "sharedWith": { $elemMatch: { email: lowercaseEmail, accepted: true } } }, // Shared
            { communityId: { $in: communityIds } } // Inherited via Community Admin
        ]
    };
}

/**
 * Checks if a user has access to a specific project and returns the access level.
 */
export async function getProjectAccessLevel(projectId: string | mongoose.Types.ObjectId, userId: string, userEmail: string) {
    const Project = (await import("@/models/Project")).default;
    const project = await Project.findById(projectId);

    if (!project) return { hasAccess: false, role: null };

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const lowercaseEmail = userEmail.toLowerCase();

    // 1. Check Owner
    if (project.userId.toString() === userId) {
        return { hasAccess: true, role: "Owner" };
    }

    // 2. Check Community Admin/Owner
    if (project.communityId) {
        const community = await Community.findById(project.communityId);
        if (community) {
            const isCommunityAdmin = community.ownerId.toString() === userId ||
                community.members.some((m: any) => m.userId.toString() === userId && m.role === "admin");

            if (isCommunityAdmin) {
                return { hasAccess: true, role: "Community Admin" };
            }
        }
    }

    // 3. Check Explicit Collaboration
    const collab = project.sharedWith.find((c: any) => c.email === lowercaseEmail && c.accepted === true);
    if (collab) {
        return { hasAccess: true, role: collab.role };
    }

    return { hasAccess: false, role: null };
}

import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Please enter email and password");
                }

                await connectDB();

                // Find user and include password field
                const user = await User.findOne({ email: credentials.email }).select(
                    "+password"
                );

                if (!user) {
                    throw new Error("Invalid email or password");
                }

                if (!user.password) {
                    throw new Error("Please sign in with Google");
                }

                const isPasswordValid = await user.comparePassword(
                    credentials.password
                );

                if (!isPasswordValid) {
                    throw new Error("Invalid email or password");
                }

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                await connectDB();

                // Check if user exists
                const existingUser = await User.findOne({ email: user.email });

                if (!existingUser) {
                    // Create new user
                    await User.create({
                        name: user.name,
                        email: user.email,
                        image: user.image,
                        provider: "google",
                        emailVerified: new Date(),
                    });
                }
            }

            return true;
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
            }

            // For Google OAuth, get user ID from database
            if (account?.provider === "google" && token.email) {
                await connectDB();
                const dbUser = await User.findOne({ email: token.email });
                if (dbUser) {
                    token.id = dbUser._id.toString();
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
};
