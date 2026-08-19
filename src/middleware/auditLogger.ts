import { Request, Response, NextFunction } from "express";

interface IAuditLogPayload {
  timestamp: string;
  method: string;
  url: string;
  ip: string | undefined;
  userAgent: string | undefined;
  statusCode: number;
  durationMs: number;
  query: Record<string, any>;
  body: Record<string, any>;
}

const sanitizePayload = (obj: any): any => {
  if (!obj || typeof obj !== "object") return obj;

  const SENSITIVE_KEYS = [
    "password",
    "token",
    "authorization",
    "secret",
    "creditcard",
    "cvv",
  ];
  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key of Object.keys(sanitized)) {
    if (
      SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive))
    ) {
      sanitized[key] = "***REDACTED***";
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizePayload(sanitized[key]);
    }
  }

  return sanitized;
};

export const auditFailureLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = Date.now();

  res.on("finish", () => {
    const statusCode = res.statusCode;

    if (statusCode >= 400) {
      const durationMs = Date.now() - startTime;
      const logPayload: IAuditLogPayload = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
        statusCode,
        durationMs,
        query: sanitizePayload(req.query),
        body: sanitizePayload(req.body),
      };

      console.error(
        `[AUDIT FAILURE LOG] [${logPayload.timestamp}] ${logPayload.method} ${logPayload.url} -> Status: ${logPayload.statusCode} (${logPayload.durationMs}ms)`,
      );
      console.error(`   Details:`, JSON.stringify(logPayload, null, 2));
    }
  });

  next();
};

export default auditFailureLogger;
