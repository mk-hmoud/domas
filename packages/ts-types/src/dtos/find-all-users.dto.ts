import { PaginationDto } from "./pagination.dto";

export interface FindAllUsersDto extends PaginationDto {
  roles?: string[];
}
