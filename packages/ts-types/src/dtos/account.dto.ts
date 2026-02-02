export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
