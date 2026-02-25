import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivity extends Document {
    projectId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    userName: string;
    action: string;
    type: "task" | "command" | "credential" | "note" | "member" | "system";
    details?: string;
    createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        userName: {
            type: String,
            required: true,
        },
        action: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["task", "command", "credential", "note", "member", "system"],
            required: true,
        },
        details: {
            type: String,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Index for efficient project-specific queries
ActivitySchema.index({ projectId: 1, createdAt: -1 });

const Activity: Model<IActivity> =
    mongoose.models.Activity || mongoose.model<IActivity>("Activity", ActivitySchema);

export default Activity;
