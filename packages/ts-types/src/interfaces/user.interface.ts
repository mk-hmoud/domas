import { Role } from "./role.interface";

export interface User {
  id: string;
  email: string;
  isActive: boolean;
  isRecoveryAdmin: boolean;
  roles?: Role[];
  permissions?: string[];
  createdAt: Date;
  updatedAt: Date;
}
