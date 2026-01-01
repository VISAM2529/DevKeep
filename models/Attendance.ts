import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAttendance extends Document {
    userId: mongoose.Types.ObjectId;
    communityId: mongoose.Types.ObjectId;
    clockIn: Date;
    clockOut?: Date;
    totalHours: number;
    date: string; // YYYY-MM-DD format for grouping
    status: "active" | "completed";
    createdAt: Date;
    updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        communityId: {
            type: Schema.Types.ObjectId,
            ref: "Community",
            required: true,
            index: true,
        },
        clockIn: {
            type: Date,
            required: true,
        },
        clockOut: {
            type: Date,
        },
        totalHours: {
            type: Number,
            default: 0,
        },
        date: {
            type: String,
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ["active", "completed"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
AttendanceSchema.index({ userId: 1, communityId: 1, date: 1 });
AttendanceSchema.index({ communityId: 1, date: 1 });
AttendanceSchema.index({ status: 1, userId: 1 });

const Attendance: Model<IAttendance> =
    mongoose.models.Attendance || mongoose.model<IAttendance>("Attendance", AttendanceSchema);

export default Attendance;
