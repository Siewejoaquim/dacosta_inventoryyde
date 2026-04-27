import { IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  @MaxLength(500)
  description!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  @MaxLength(50)
  category!: string;
}
