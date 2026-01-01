import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommand extends Document {
    userId: mongoose.Types.ObjectId;
    projectId?: mongoose.Types.ObjectId;
    title: string;
    command: string;
    description?: string;
    category: "VSCode" | "Git" | "Docker" | "NPM" | "Server" | "Other";
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

const CommandSchema = new Schema<ICommand>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            index: true,
        },
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
        },
        command: {
            type: String,
            required: [true, "Command is required"],
        },
        description: {
            type: String,
            trim: true,
        },
        category: {
            type: String,
            enum: ["VSCode", "Git", "Docker", "NPM", "Server", "Other"],
            default: "Other",
        },
        tags: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
CommandSchema.index({ userId: 1, category: 1 });
CommandSchema.index({ userId: 1, projectId: 1 });
CommandSchema.index({ userId: 1, createdAt: -1 });

const Command: Model<ICommand> =
    mongoose.models.Command || mongoose.model<ICommand>("Command", CommandSchema);

export default Command;
