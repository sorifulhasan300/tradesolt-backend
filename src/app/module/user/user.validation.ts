import { z } from "zod";
import { UserRoles } from "../../../types/role.types.js";

export const updateUserStatusSchema = z.object({
  status: z.string().optional(),
  emailVerified: z.boolean().optional(),
});

export type TUpdateUserStatus = z.infer<typeof updateUserStatusSchema>;

export const updateUserRoleSchema = z.object({
  role: z.enum([
    UserRoles.CUSTOMER,
    UserRoles.TRADER,
    UserRoles.BUSINESS_ADMIN,
    UserRoles.PLATFORM_ADMIN,
  ]),
});

export type TUpdateUserRole = z.infer<typeof updateUserRoleSchema>;
