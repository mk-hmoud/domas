import { PaginationDto } from "./pagination.dto";
import { UserRole } from "../enums/user-role.enum";

export interface FindAllUsersDto extends PaginationDto {
  role?: UserRole[];
}
