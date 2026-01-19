import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FindAllStudentsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string; // Search by number, name, email
}
