import NextAuth, { NextAuthOptions } from "next-auth";
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
