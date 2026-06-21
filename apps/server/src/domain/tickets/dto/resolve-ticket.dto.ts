import { IsString, MinLength } from 'class-validator';

export class ResolveTicketDto {
  @IsString()
  @MinLength(3)
  resolutionNotes!: string;
}
