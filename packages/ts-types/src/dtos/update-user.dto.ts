import { UserRole } from "../enums/user-role.enum";

export interface UpdateUserDto {
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}
