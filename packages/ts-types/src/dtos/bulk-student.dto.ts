export interface BulkDeleteStudentsDto {
  ids: string[];
}

export interface BulkUpdateStudentStatusDto {
  ids: string[];
  isActive: boolean;
}
