import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AnnouncementTargetDto } from './announcement-target.dto';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsBoolean()
  @IsOptional()
  pinned?: boolean;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsIn(['all', 'targeted'])
  @IsOptional()
  audienceMode?: 'all' | 'targeted';

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AnnouncementTargetDto)
  targets?: AnnouncementTargetDto[];
}
