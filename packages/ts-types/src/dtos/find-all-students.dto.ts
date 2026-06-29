import { PaginationDto } from "./pagination.dto";
import { GenderType } from "../enums/gender-type.enum";

export interface FindAllStudentsDto extends PaginationDto {
  search?: string;
  nationalityCode?: string;
  gender?: GenderType;
  eligible?: boolean;
}
