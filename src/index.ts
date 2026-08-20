import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { StatusCodes } from "http-status-codes";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import apiRoutes from "./routes/api.routes.js";
import notFoundHandler from "./middleware/notFound.js";
import globalErrorHandler from "./middleware/globalErrorHandler.js";
import auditFailureLogger from "./middleware/auditLogger.js";

import envVars from "./config/env.config.js";

const app: Application = express();
const PORT = envVars.PORT;

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(auditFailureLogger);

// Mount Better Auth Router Handler (/api/v1/auth/*splat)
app.all("/api/v1/auth/*splat", toNodeHandler(auth));

// Health Check Endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    status: "OK",
    message: "TradeSlot Backend API Running",
  });
});

// Route Mounts
app.use("/api/v1", apiRoutes);

// Global Not Found Handler
app.use(notFoundHandler);

// Global Error Handler (must be registered last)
app.use(globalErrorHandler);

// Server Startup
app.listen(PORT, () => {
  console.log(`🚀 TradeSlot Backend Server running on port ${PORT}`);
});

export default app;
