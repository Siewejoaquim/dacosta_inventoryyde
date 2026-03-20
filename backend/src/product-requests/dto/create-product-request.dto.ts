import { IsOptional, IsString } from 'class-validator';

export class CreateProductRequestDto {
  @IsString()
  productName!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  customerName?: string;
}
