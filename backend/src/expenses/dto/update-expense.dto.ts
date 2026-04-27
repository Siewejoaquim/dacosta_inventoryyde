import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}
