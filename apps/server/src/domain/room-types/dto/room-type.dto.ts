import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoomTypeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  galleryUrls?: string[] = [];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[] = [];
}

export class UpdateRoomTypeDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  galleryUrls?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];
}
