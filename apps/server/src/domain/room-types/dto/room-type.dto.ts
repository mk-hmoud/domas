import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRoomTypeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  nameTr?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  descriptionTr?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  galleryUrls?: string[] = [];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[] = [];

  @IsInt()
  @Min(1)
  @Max(8)
  capacity!: number;
}

export class UpdateRoomTypeDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  nameTr?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  descriptionTr?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  galleryUrls?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @IsInt()
  @Min(1)
  @Max(8)
  @IsOptional()
  capacity?: number;
}
