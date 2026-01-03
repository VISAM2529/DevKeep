import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICredential extends Document {
    userId: mongoose.Types.ObjectId;
    projectId?: mongoose.Types.ObjectId;
    platform: string;
    username?: string;
    email?: string;
    password: string; // Encrypted
    notes?: string;
    isHidden: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CredentialSchema = new Schema<ICredential>(
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
        platform: {
            type: String,
            required: [true, "Platform is required"],
            trim: true,
        },
        username: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            // This will be encrypted before saving
        },
        notes: {
            type: String,
            trim: true,
        },
        isHidden: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
CredentialSchema.index({ userId: 1, projectId: 1 });
CredentialSchema.index({ userId: 1, isHidden: 1 });
CredentialSchema.index({ userId: 1, createdAt: -1 });

const Credential: Model<ICredential> =
    mongoose.models.Credential ||
    mongoose.model<ICredential>("Credential", CredentialSchema);

export default Credential;
