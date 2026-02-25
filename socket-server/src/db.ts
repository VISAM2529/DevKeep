import mongoose from "mongoose";
import config from "./config";

let isConnected = false;

export async function connectDB(): Promise<void> {
    if (isConnected) return;

    try {
        await mongoose.connect(config.mongoUri, {
            bufferCommands: false,
            maxPoolSize: 10,
        });
        isConnected = true;
        console.log("✅  MongoDB connected (socket server)");
    } catch (err) {
        console.error("❌  MongoDB connection failed:", err);
        // Fatal — the server must not start without a DB connection
        process.exit(1);
    }

    mongoose.connection.on("disconnected", () => {
        console.warn("⚠️   MongoDB disconnected — attempting reconnect…");
        isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
        console.log("♻️   MongoDB reconnected");
        isConnected = true;
    });
}
