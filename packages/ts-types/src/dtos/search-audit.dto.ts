import { PaginationDto } from "./pagination.dto";

export interface SearchAuditDto extends PaginationDto {
  startDate?: string;
  endDate?: string;
  actions?: string[];
  userId?: string;
  tableName?: string;
  search?: string;
}
