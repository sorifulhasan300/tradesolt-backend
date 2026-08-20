import { UserRoles } from "./role.types.js";

export interface UserTypes {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRoles;
  emailVerified: boolean;
}

export default UserTypes;
