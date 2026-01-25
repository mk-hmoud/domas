import { Permission } from './permission.entity';

export class Role {
  id!: number;
  name!: string;
  description?: string;
  isSystemRole!: boolean;
  permissions?: Permission[];

  constructor(partial: Partial<Role>) {
    Object.assign(this, partial);
  }
}
