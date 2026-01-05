import { UserRole } from "../enums/user-role.enum";

export interface CreateUser {
  email: string;
  password: string;
  role: UserRole;
}
