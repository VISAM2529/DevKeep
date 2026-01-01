import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { z } from "zod";

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
        const existingUser = await User.findOne({ email: validatedData.email });

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 400 }
            );
        }

        // Create new user (password will be hashed by pre-save hook)
        const user = await User.create({
            name: validatedData.name,
            email: validatedData.email,
            password: validatedData.password,
            provider: "credentials",
        });

        return NextResponse.json(
            {
                message: "User created successfully",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
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
