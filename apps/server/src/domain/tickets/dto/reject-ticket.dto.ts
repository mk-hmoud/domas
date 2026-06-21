import { IsString, MinLength } from 'class-validator';

export class RejectTicketDto {
  @IsString()
  @MinLength(3)
  rejectionReason!: string;
}
