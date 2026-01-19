import { PaginationDto } from "./pagination.dto";

export interface FindAllStudentsDto extends PaginationDto {
  search?: string;
}
