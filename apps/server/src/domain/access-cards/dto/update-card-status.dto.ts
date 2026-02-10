import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CardStatus } from '../../../common/enums/card-status.enum';

export class UpdateCardStatusDto {
  @IsEnum(CardStatus)
  @IsNotEmpty()
  status!: CardStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
