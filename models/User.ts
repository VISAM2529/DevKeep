import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    hiddenSpacePassword?: string;
    image?: string;
    emailVerified?: Date;
    provider?: "credentials" | "google";
    birthDate?: Date;
    lastBirthdayNotificationYear?: number;
    plan: "basic" | "pro" | "premium";
    razorpayCustomerId?: string;
    razorpaySubscriptionId?: string;
    subscriptionStatus?: "active" | "past_due" | "canceled" | "incomplete" | "trialing" | "created" | "authenticated";
    subscriptionEndDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    lastSeen: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
        },
        password: {
            type: String,
            minlength: [6, "Password must be at least 6 characters"],
            select: false, // Don't return password by default
        },
        hiddenSpacePassword: {
            type: String,
            minlength: [4, "PIN/Password must be at least 4 characters"],
            select: false,
        },
        image: {
            type: String,
        },
        emailVerified: {
            type: Date,
        },
        provider: {
            type: String,
            enum: ["credentials", "google"],
            default: "credentials",
        },
        birthDate: {
            type: Date,
        },
        lastBirthdayNotificationYear: {
            type: Number,
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
        plan: {
            type: String,
            enum: ["basic", "pro", "premium"],
            default: "basic",
        },
        razorpayCustomerId: {
            type: String,
        },
        razorpaySubscriptionId: {
            type: String,
        },
        subscriptionStatus: {
            type: String,
            enum: ["active", "past_due", "canceled", "incomplete", "trialing", "created", "authenticated"],
        },
        subscriptionEndDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
// Hash password and hiddenSpacePassword before saving
UserSchema.pre("save", async function (next) {
    try {
        const salt = await bcrypt.genSalt(10);

        if (this.isModified("password") && this.password) {
            this.password = await bcrypt.hash(this.password, salt);
        }

        if (this.isModified("hiddenSpacePassword") && this.hiddenSpacePassword) {
            this.hiddenSpacePassword = await bcrypt.hash(this.hiddenSpacePassword, salt);
        }

        next();
    } catch (error: any) {
        next(error);
    }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// Prevent model recompilation in development
const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
