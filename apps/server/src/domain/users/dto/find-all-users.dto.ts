import { IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { UserRole } from '../../../common/enums/user-role.enum';

export class FindAllUsersDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((v) => v.trim());
    }
    return value;
  })
  @IsEnum(UserRole, { each: true })
  role?: UserRole[];
}
