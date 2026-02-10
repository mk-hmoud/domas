import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CardStatus } from '@domas/ts-types';

export class UpdateCardStatusDto {
  @IsEnum(CardStatus)
  @IsNotEmpty()
  status!: CardStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
