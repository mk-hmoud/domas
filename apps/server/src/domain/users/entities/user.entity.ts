import { UserRole } from '../../../common/enums/user-role.enum';

export class User {
  id!: string;
  email!: string;
  passwordHash!: string;
  role!: UserRole;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
