import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProductRequestDto {
  @IsString()
  @MaxLength(200)
  productName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  customerName?: string;
}
