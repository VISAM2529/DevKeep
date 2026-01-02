import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProject extends Document {
    userId: mongoose.Types.ObjectId;
    communityId?: mongoose.Types.ObjectId; // Optional relationship
    name: string;
    description?: string;
    techStack: string[];
    repositoryUrl?: string;
    liveUrl?: string;
    environment: "Local" | "Staging" | "Production";
    status: "Active" | "Archived";
    isMeetingActive: boolean;
    activeMeetingId?: string;
    logo?: string;
    banner?: string;
    sharedWith: {
        email: string;
        role: "Collaborator" | "Admin" | "Project Lead";
        addedAt: Date;
        accepted: boolean;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        communityId: {
            type: Schema.Types.ObjectId,
            ref: "Community",
            index: true,
        },
        name: {
            type: String,
            required: [true, "Project name is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        techStack: {
            type: [String],
            default: [],
        },
        repositoryUrl: {
            type: String,
            trim: true,
        },
        liveUrl: {
            type: String,
            trim: true,
        },
        environment: {
            type: String,
            enum: ["Local", "Staging", "Production"],
            default: "Local",
        },
        status: {
            type: String,
            enum: ["Active", "Archived"],
            default: "Active",
        },
        isMeetingActive: {
            type: Boolean,
            default: false,
        },
        activeMeetingId: {
            type: String, // Stores the unique ID of the current meeting session
        },
        logo: {
            type: String,
        },
        banner: {
            type: String,
        },
        sharedWith: [
            {
                email: { type: String, required: true, lowercase: true },
                role: { type: String, enum: ["Collaborator", "Admin", "Project Lead"], default: "Collaborator" },
                addedAt: { type: Date, default: Date.now },
                accepted: { type: Boolean, default: false },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient user queries
ProjectSchema.index({ userId: 1, status: 1 });
ProjectSchema.index({ userId: 1, createdAt: -1 });
ProjectSchema.index({ "sharedWith.email": 1 });
// Ensure efficient lookup by community if present
ProjectSchema.index({ communityId: 1 });

const Project: Model<IProject> =
    mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
