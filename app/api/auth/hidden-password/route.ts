import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { action, password } = body;

        if (!password) {
            return NextResponse.json({ error: "Password is required" }, { status: 400 });
        }

        await connectDB();

        // Use +headerSpacePassword to select it since it's select: false
        const user = await User.findById(session.user.id).select("+hiddenSpacePassword");

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (action === "set") {
            // Validate password length
            if (password.length < 4) {
                return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
            }

            // The pre-save hook in User model handles hashing
            // We just set the field and save
            user.hiddenSpacePassword = password;
            await user.save();

            return NextResponse.json({ success: true, message: "Hidden space password set successfully" });
        }
        else if (action === "verify") {
            if (!user.hiddenSpacePassword) {
                return NextResponse.json({ error: "Hidden space password not set" }, { status: 404 });
            }

            const isValid = await bcrypt.compare(password, user.hiddenSpacePassword);

            if (isValid) {
                return NextResponse.json({ success: true, valid: true });
            } else {
                return NextResponse.json({ success: false, valid: false }, { status: 401 });
            }
        }
        else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

    } catch (error) {
        console.error("Hidden password API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
