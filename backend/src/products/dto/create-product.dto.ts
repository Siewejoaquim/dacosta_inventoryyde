import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MaxLength(200)
  productName!: string;

  @IsString()
  @MaxLength(100)
  category!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  supplier?: string;

  @IsNumber()
  @Min(0)
  quantityInStock!: number;

  @IsNumber()
  @Min(0)
  purchasePrice!: number;

  @IsNumber()
  @Min(0)
  sellingPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderPoint?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

