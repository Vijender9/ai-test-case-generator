import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import { router as aiRouter} from "./routes/AI.route.js";
import githubRouter from "./routes/github.routes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Health
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));

// Routers
app.use("/auth/github", githubRouter);
app.use("/api/github", githubRouter); // re-uses same router for API endpoints
app.use("/api/ai", aiRouter);

// 404
app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

// Global error handler

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 1000;
app.listen(PORT, () => console.log(`Backend is running on :${PORT}`));
