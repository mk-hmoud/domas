import { IsArray, IsBoolean, IsUUID } from 'class-validator';

export class BulkDeleteStudentsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids!: string[];
}

export class BulkUpdateStudentStatusDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids!: string[];

  @IsBoolean()
  isActive!: boolean;
}
