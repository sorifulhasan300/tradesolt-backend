import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer } from 'better-auth/plugins';
import prisma from './prisma.js';
import envVars from '../config/env.config.js';

export const auth = betterAuth({
  baseURL: envVars.BETTER_AUTH_URL,
  basePath: '/api/v1/auth',
  secret: envVars.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    bearer(),
  ],
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'CUSTOMER',
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // If the newly created user has role 'TRADER', automatically create a TraderProfile
          if ((user as any).role === 'TRADER') {
            const existingProfile = await prisma.traderProfile.findUnique({
              where: { userId: user.id },
            });

            if (!existingProfile) {
              await prisma.traderProfile.create({
                data: {
                  userId: user.id,
                  displayName: (user as any).name || user.email || 'Trader',
                },
              });
            }
          }
        },
      },
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
