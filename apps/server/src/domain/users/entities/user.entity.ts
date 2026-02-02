import { Role } from './role.entity';

export class User {
  id!: string;
  email!: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  passwordHash?: string;
  isActive!: boolean;
  isRecoveryAdmin!: boolean;
  roles?: Role[];
  permissions?: string[]; // Flattened list for easy access in code
  createdAt!: Date;
  updatedAt!: Date;

  // Helpers
  hasRole(roleName: string): boolean {
    return this.isRecoveryAdmin || (this.roles?.some((r) => r.name === roleName) ?? false);
  }

  hasPermission(slug: string): boolean {
    return this.isRecoveryAdmin || (this.permissions?.includes(slug) ?? false);
  }

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
