import { IsIn, IsInt, IsOptional, IsUUID } from 'class-validator';

export class AnnouncementTargetDto {
  @IsIn(['student', 'semester', 'location'])
  targetType!: 'student' | 'semester' | 'location';

  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsInt()
  @IsOptional()
  semesterId?: number;

  @IsInt()
  @IsOptional()
  locationId?: number;
}
