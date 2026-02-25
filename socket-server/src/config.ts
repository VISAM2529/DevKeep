import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
    const val = process.env[key];
    if (!val) throw new Error(`❌  Missing required environment variable: ${key}`);
    return val;
}

const config = {
    port: parseInt(process.env.PORT || "3002", 10),
    mongoUri: required("MONGODB_URI"),
    nextAuthSecret: required("NEXTAUTH_SECRET"),
    internalSocketKey: required("INTERNAL_SOCKET_KEY"),
    clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
    nodeEnv: process.env.NODE_ENV || "development",
    isDev: (process.env.NODE_ENV || "development") === "development",
} as const;

export default config;
