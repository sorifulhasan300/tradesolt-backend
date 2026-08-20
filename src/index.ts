import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { StatusCodes } from "http-status-codes";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import notFoundHandler from "./middleware/notFound.js";
import globalErrorHandler from "./middleware/globalErrorHandler.js";
import auditFailureLogger from "./middleware/auditLogger.js";

import envVars from "./config/env.config.js";
import { routers } from "./routes/api.routes.js";

const app: Application = express();
const PORT = envVars.PORT;

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(auditFailureLogger);

// Health Check Endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    status: "OK",
    message: "TradeSlot Backend API Running",
  });
});

// Custom API Route Mounts (Custom endpoints like /api/v1/auth/resend-otp and /api/auth/resend-otp)
app.use("/api/v1", routers);

// Mount Better Auth Router Handler (/api/v1/auth/*splat)
app.all("/api/v1/auth/*splat", toNodeHandler(auth));

// Global Not Found Handler
app.use(notFoundHandler);

// Global Error Handler (must be registered last)
app.use(globalErrorHandler);

// Server Startup
app.listen(PORT, () => {
  console.log(`🚀 TradeSlot Backend Server running on port ${PORT}`);
});

export default app;
