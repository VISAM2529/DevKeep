import "dotenv/config";
import http from "http";
import express from "express";
import { rateLimit } from "express-rate-limit";
import config from "./config";
import { connectDB } from "./db";
import { initSocket } from "./socket";
import { createBroadcastRouter } from "./routes/broadcast";

async function main() {
    // ── 1. Connect to MongoDB (fatal if fails) ────────────────────────────────
    await connectDB();

    // ── 2. Create Express app ─────────────────────────────────────────────────
    const app = express();

    app.use(express.json({ limit: "1mb" }));
    app.use(express.urlencoded({ extended: true }));

    // Trust proxy (needed behind Render's reverse proxy)
    app.set("trust proxy", 1);

    // Basic rate limiter for all HTTP routes
    app.use(
        rateLimit({
            windowMs: 60 * 1000, // 1 minute
            max: 120,
            standardHeaders: true,
            legacyHeaders: false,
            message: { error: "Too many requests" },
        })
    );

    // ── 3. Health check (required for Render) ─────────────────────────────────
    app.get("/health", (_req, res) => {
        res.json({ status: "ok", uptime: process.uptime() });
    });

    // ── 4. Create HTTP server & attach Socket.io ──────────────────────────────
    const httpServer = http.createServer(app);
    const io = initSocket(httpServer);

    // ── 5. Mount internal broadcast routes ───────────────────────────────────
    app.use("/internal", createBroadcastRouter(io));

    // ── 6. 404 fallback ───────────────────────────────────────────────────────
    app.use((_req, res) => {
        res.status(404).json({ error: "Not found" });
    });

    // ── 7. Global error handler ───────────────────────────────────────────────
    app.use(
        (
            err: Error,
            _req: express.Request,
            res: express.Response,
            _next: express.NextFunction
        ) => {
            console.error("[EXPRESS]", err);
            res.status(500).json({ error: "Internal server error" });
        }
    );

    // ── 8. Start listening ────────────────────────────────────────────────────
    httpServer.listen(config.port, () => {
        console.log(
            `🚀  DevKeep Socket Server listening on port ${config.port} [${config.nodeEnv}]`
        );
        console.log(`   Health: http://localhost:${config.port}/health`);
        console.log(`   Broadcast: http://localhost:${config.port}/internal/broadcast`);
    });

    // ── 9. Graceful shutdown ──────────────────────────────────────────────────
    const shutdown = async (signal: string) => {
        console.log(`\n[SHUTDOWN] Received ${signal} — closing server…`);
        httpServer.close(() => {
            console.log("[SHUTDOWN] HTTP server closed");
            process.exit(0);
        });
        setTimeout(() => process.exit(1), 10_000); // Force-exit after 10s
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
    console.error("❌  Fatal startup error:", err);
    process.exit(1);
});
