import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVerificationToken extends Document {
    userId: mongoose.Types.ObjectId;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
}

const VerificationTokenSchema = new Schema<IVerificationToken>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tokenHash: {
            type: String,
            required: true,
            unique: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // TTL index: MongoDB deletes document when expiresAt is reached
        },
    },
    {
        timestamps: true,
    }
);

const VerificationToken: Model<IVerificationToken> =
    mongoose.models.VerificationToken ||
    mongoose.model<IVerificationToken>("VerificationToken", VerificationTokenSchema);

export default VerificationToken;
