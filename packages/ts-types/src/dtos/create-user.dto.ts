export interface CreateUserDto {
  email: string;
  password?: string;
  roleIds?: number[];
}
