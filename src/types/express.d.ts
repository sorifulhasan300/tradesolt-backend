import * as express from "express";
import { Session } from "better-auth/types";
import { UserRole } from "./role.types.ts";

declare global {
  namespace Express {
    interface Request {
      user?: UserRole;
      session?: Session;
    }
  }
}
