import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import VerificationToken from "@/models/VerificationToken";
import crypto from "crypto";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
        }

        await connectDB();

        // Hash the incoming token to compare with stored hash
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        // Find the token record
        const tokenRecord = await VerificationToken.findOne({ tokenHash });

        if (!tokenRecord) {
            return NextResponse.json(
                { error: "Invalid or expired verification token" },
                { status: 400 }
            );
        }

        // Check expiration
        if (tokenRecord.expiresAt < new Date()) {
            await VerificationToken.deleteOne({ _id: tokenRecord._id });
            return NextResponse.json(
                { error: "Verification link has expired" },
                { status: 400 }
            );
        }

        // Find user
        const user = await User.findById(tokenRecord.userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Already verified?
        if (user.emailVerified) {
            await VerificationToken.deleteOne({ _id: tokenRecord._id });
            return NextResponse.json(
                { message: "Email already verified", alreadyVerified: true, email: user.email },
                { status: 200 }
            );
        }

        // Mark as verified
        user.emailVerified = new Date();
        await user.save();

        // Delete used token
        await VerificationToken.deleteOne({ _id: tokenRecord._id });

        return NextResponse.json(
            {
                message: "Email verified successfully",
                userId: user._id.toString(),
                email: user.email,
                name: user.name,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Verification error:", error);
        return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }
}
