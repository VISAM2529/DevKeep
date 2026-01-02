import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
    recipientId: mongoose.Types.ObjectId;
    senderId?: mongoose.Types.ObjectId;
    type: "task_update" | "task_assigned" | "community_event" | "project_event" | "system";
    title: string;
    message: string;
    link?: string;
    projectId?: mongoose.Types.ObjectId;
    communityId?: mongoose.Types.ObjectId;
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        recipientId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        type: {
            type: String,
            enum: ["task_update", "task_assigned", "community_event", "project_event", "system"],
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        link: {
            type: String,
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
        },
        communityId: {
            type: Schema.Types.ObjectId,
            ref: "Community",
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

NotificationSchema.index({ recipientId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

const Notification: Model<INotification> =
    mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
