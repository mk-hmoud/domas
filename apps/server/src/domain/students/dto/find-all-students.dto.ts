import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { GenderType } from '../../../common/enums/gender-type.enum';

export class FindAllStudentsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string; // Search by number, name, email

  @IsOptional()
  @IsString()
  nationalityCode?: string;

  @IsOptional()
  @IsEnum(GenderType)
  gender?: GenderType;
}
