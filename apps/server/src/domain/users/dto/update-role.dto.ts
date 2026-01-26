import { IsString, IsOptional, IsArray, IsInt } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  permissionIds?: number[]; // If provided, replaces all permissions
}
