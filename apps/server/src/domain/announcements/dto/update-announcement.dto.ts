import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AnnouncementTargetDto } from './announcement-target.dto';

export class UpdateAnnouncementDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsBoolean()
  @IsOptional()
  pinned?: boolean;

  @IsDateString()
  @IsOptional()
  expiresAt?: string | null;

  @IsIn(['all', 'targeted'])
  @IsOptional()
  audienceMode?: 'all' | 'targeted';

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AnnouncementTargetDto)
  targets?: AnnouncementTargetDto[];
}
