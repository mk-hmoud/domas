import { IsEnum, IsInt, IsOptional, IsUUID, IsArray } from 'class-validator';

export class ResolveContactsDto {
  @IsEnum(['all', 'location', 'list'])
  scope!: 'all' | 'location' | 'list';

  @IsInt()
  @IsOptional()
  locationId?: number;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  studentIds?: string[];
}
