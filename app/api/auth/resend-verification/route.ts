import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import VerificationToken from "@/models/VerificationToken";
import { sendVerificationEmail } from "@/lib/mailer";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        await connectDB();

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Return success to avoid email enumeration
            return NextResponse.json({ message: "If this email exists, a verification link was sent." }, { status: 200 });
        }

        if (user.emailVerified) {
            return NextResponse.json({ error: "This email is already verified" }, { status: 400 });
        }

        // Delete any existing tokens for this user
        await VerificationToken.deleteMany({ userId: user._id });

        // Generate a new raw token
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        // Create new token with 15-minute expiry
        await VerificationToken.create({
            userId: user._id,
            tokenHash,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });

        // Send email asynchronously
        sendVerificationEmail(user.email, user.name, rawToken).catch((err) => {
            console.error("Failed to resend verification email:", err);
        });

        return NextResponse.json({ message: "Verification email resent successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("Resend verification error:", error);
        return NextResponse.json({ error: "Failed to resend verification email" }, { status: 500 });
    }
}
