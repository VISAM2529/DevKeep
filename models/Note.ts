import mongoose, { Schema, Document, Model } from "mongoose";

export interface INote extends Document {
    userId: mongoose.Types.ObjectId;
    projectId?: mongoose.Types.ObjectId;
    communityId?: mongoose.Types.ObjectId;
    title: string;
    content: string; // Markdown content
    attachments: string[]; // Cloudinary URLs
    isGlobal: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
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
        communityId: {
            type: Schema.Types.ObjectId,
            ref: "Community",
            index: true,
        },
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
        },
        content: {
            type: String,
            required: [true, "Content is required"],
        },
        attachments: {
            type: [String],
            default: [],
        },
        isGlobal: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
NoteSchema.index({ userId: 1, isGlobal: 1 });
NoteSchema.index({ userId: 1, projectId: 1 });
NoteSchema.index({ userId: 1, createdAt: -1 });

const Note: Model<INote> =
    mongoose.models.Note || mongoose.model<INote>("Note", NoteSchema);

export default Note;
