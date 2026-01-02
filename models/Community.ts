import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommunity extends Document {
    name: string;
    description: string;
    ownerId: mongoose.Types.ObjectId;
    members: {
        userId: mongoose.Types.ObjectId;
        role: "admin" | "member";
        joinedAt: Date;
    }[];
    icon?: string;
    isMeetingActive: boolean;
    activeMeetingId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CommunitySchema = new Schema<ICommunity>(
    {
        name: {
            type: String,
            required: [true, "Community name is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        members: [
            {
                userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
                role: { type: String, enum: ["admin", "member"], default: "member" },
                joinedAt: { type: Date, default: Date.now },
            },
        ],
        icon: {
            type: String,
        },
        isMeetingActive: {
            type: Boolean,
            default: false,
        },
        activeMeetingId: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

CommunitySchema.index({ "members.userId": 1 });
const Community: Model<ICommunity> =
    mongoose.models.Community || mongoose.model<ICommunity>("Community", CommunitySchema);

export default Community;
