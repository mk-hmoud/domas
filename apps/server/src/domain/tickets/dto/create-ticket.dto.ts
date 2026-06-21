import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { TicketCategory } from '../../../common/enums/ticket-category.enum';

export class CreateTicketDto {
  @IsEnum(TicketCategory)
  category!: TicketCategory;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(5)
  description!: string;
}
