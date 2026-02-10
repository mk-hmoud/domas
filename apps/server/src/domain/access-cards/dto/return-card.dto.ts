import { IsOptional, IsString } from 'class-validator';

export class ReturnCardDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
