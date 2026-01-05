export interface CreateSemesterDto {
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}
