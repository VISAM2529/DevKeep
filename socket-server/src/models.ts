import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Message ────────────────────────────────────────────────────────────────

export interface IMessage extends Document {
    communityId?: mongoose.Types.ObjectId;
    projectId?: mongoose.Types.ObjectId;
    meetingId?: string;
    senderId: mongoose.Types.ObjectId;
    content: string;
    readBy: { userId: mongoose.Types.ObjectId; readAt: Date }[];
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        communityId: { type: Schema.Types.ObjectId, ref: "Community", index: true },
        projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
        meetingId: { type: String, index: true },
        senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true, trim: true },
        readBy: [
            {
                userId: { type: Schema.Types.ObjectId, ref: "User" },
                readAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

MessageSchema.index({ communityId: 1, createdAt: 1 });
MessageSchema.index({ projectId: 1, createdAt: 1 });

export const Message: Model<IMessage> =
    mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

// ─── Notification ────────────────────────────────────────────────────────────

export type NotificationType =
    | "task_update"
    | "task_assigned"
    | "community_event"
    | "project_event"
    | "system"
    | "meeting_started"
    | "birthday_wish";

export interface INotification extends Document {
    recipientId: mongoose.Types.ObjectId;
    senderId?: mongoose.Types.ObjectId;
    type: NotificationType;
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
        recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        senderId: { type: Schema.Types.ObjectId, ref: "User" },
        type: {
            type: String,
            enum: [
                "task_update",
                "task_assigned",
                "community_event",
                "project_event",
                "system",
                "meeting_started",
                "birthday_wish",
            ],
            required: true,
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        link: { type: String },
        projectId: { type: Schema.Types.ObjectId, ref: "Project" },
        communityId: { type: Schema.Types.ObjectId, ref: "Community" },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification: Model<INotification> =
    mongoose.models.Notification ||
    mongoose.model<INotification>("Notification", NotificationSchema);

// ─── Activity ────────────────────────────────────────────────────────────────

export type ActivityType = "task" | "command" | "credential" | "note" | "member" | "system";

export interface IActivity extends Document {
    projectId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    userName: string;
    action: string;
    type: ActivityType;
    details?: string;
    createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
    {
        projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        userName: { type: String, required: true },
        action: { type: String, required: true },
        type: {
            type: String,
            enum: ["task", "command", "credential", "note", "member", "system"],
            required: true,
        },
        details: { type: String },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

ActivitySchema.index({ projectId: 1, createdAt: -1 });

export const Activity: Model<IActivity> =
    mongoose.models.Activity || mongoose.model<IActivity>("Activity", ActivitySchema);

// ─── Community (lean reference) ──────────────────────────────────────────────

export interface ICommunityMember {
    userId: mongoose.Types.ObjectId;
    role: "admin" | "moderator" | "member";
    joinedAt: Date;
    accepted: boolean;
}

export interface ICommunity extends Document {
    name: string;
    ownerId: mongoose.Types.ObjectId;
    members: ICommunityMember[];
}

const CommunitySchema = new Schema<ICommunity>({
    name: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [
        {
            userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
            role: { type: String, enum: ["admin", "moderator", "member"], default: "member" },
            joinedAt: { type: Date, default: Date.now },
            accepted: { type: Boolean, default: false },
        },
    ],
});

export const Community: Model<ICommunity> =
    mongoose.models.Community || mongoose.model<ICommunity>("Community", CommunitySchema);

// ─── Project (lean reference) ─────────────────────────────────────────────────

export interface IProject extends Document {
    userId: mongoose.Types.ObjectId;
    communityId?: mongoose.Types.ObjectId;
    name: string;
    sharedWith: { email: string; role: string; accepted: boolean }[];
}

const ProjectSchema = new Schema<IProject>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    communityId: { type: Schema.Types.ObjectId, ref: "Community" },
    name: { type: String, required: true },
    sharedWith: [
        {
            email: { type: String, required: true, lowercase: true },
            role: { type: String, default: "Collaborator" },
            accepted: { type: Boolean, default: false },
        },
    ],
});

export const Project: Model<IProject> =
    mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);

// ─── User (lean reference) ────────────────────────────────────────────────────

export interface IUser extends Document {
    email: string;
    name: string;
    image?: string;
}

const UserSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    image: { type: String },
});

export const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
