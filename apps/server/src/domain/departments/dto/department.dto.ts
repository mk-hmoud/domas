import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nameEn!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nameTr!: string;
}

export class UpdateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @IsOptional()
  nameEn?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @IsOptional()
  nameTr?: string;
}
