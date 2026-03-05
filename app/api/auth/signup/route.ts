import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import VerificationToken from "@/models/VerificationToken";
import { sendVerificationEmail } from "@/lib/mailer";
import { z } from "zod";
import crypto from "crypto";

const signupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate input
        const validatedData = signupSchema.parse(body);

        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email: validatedData.email.toLowerCase() });

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 400 }
            );
        }

        // Create new user with emailVerified = false
        // Password will be hashed by mongoose pre-save hook
        const user = await User.create({
            name: validatedData.name,
            email: validatedData.email.toLowerCase(),
            password: validatedData.password,
            provider: "credentials",
            emailVerified: null, // Not verified yet
        });

        // Generate a secure raw token
        const rawToken = crypto.randomBytes(32).toString("hex");

        // Hash the token before storing
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        // Store hashed token with 15-minute expiry
        await VerificationToken.create({
            userId: user._id,
            tokenHash,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        });

        // Send verification email asynchronously (non-blocking)
        console.log(`[MAILER] Attempting to send verification email to: ${user.email}`);

        sendVerificationEmail(user.email, user.name, rawToken)
            .then(() => {
                console.log(`[MAILER] SUCCESS: Verification email sent to ${user.email}`);
            })
            .catch((err) => {
                console.error("[MAILER] ERROR: Failed to send email:", err);
            });

        return NextResponse.json(
            {
                message: "Account created. Please verify your email.",
                email: user.email,
                requiresVerification: true,
            },
            { status: 201 }
        );
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        console.error("Signup error:", error);
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        );
    }
}
