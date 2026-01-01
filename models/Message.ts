import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
    communityId?: mongoose.Types.ObjectId;
    projectId?: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    content: string;
    readBy: {
        userId: mongoose.Types.ObjectId;
        readAt: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        communityId: {
            type: Schema.Types.ObjectId,
            ref: "Community",
            index: true,
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            index: true,
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: [true, "Message content is required"],
            trim: true,
        },
        readBy: [
            {
                userId: { type: Schema.Types.ObjectId, ref: "User" },
                readAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
    }
);

MessageSchema.index({ communityId: 1, createdAt: 1 });
MessageSchema.index({ projectId: 1, createdAt: 1 });
const Message: Model<IMessage> =
    mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
