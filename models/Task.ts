import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITask extends Document {
    projectId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    status: "To Do" | "In Progress" | "Done";
    priority: "Low" | "Medium" | "High";
    deadline?: Date;
    assigneeId?: mongoose.Types.ObjectId;
    creatorId: mongoose.Types.ObjectId;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, "Task title is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ["To Do", "In Progress", "Done"],
            default: "To Do",
        },
        priority: {
            type: String,
            enum: ["Low", "Medium", "High"],
            default: "Medium",
        },
        deadline: {
            type: Date,
        },
        assigneeId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        creatorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        completedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ assigneeId: 1 });

const Task: Model<ITask> =
    mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);

export default Task;
