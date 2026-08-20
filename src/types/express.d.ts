import * as express from 'express';
import { User, Session } from 'better-auth/types';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: Session;
    }
  }
}
