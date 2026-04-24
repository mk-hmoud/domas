import { Role } from "./role.interface";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isActive: boolean;
  isRecoveryAdmin: boolean;
  onboardingCompleted: boolean;
  roles?: Role[];
  permissions?: string[];
  createdAt: Date;
  updatedAt: Date;
}
