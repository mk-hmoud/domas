export interface CreateUserDto {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  roleIds?: number[];
}
