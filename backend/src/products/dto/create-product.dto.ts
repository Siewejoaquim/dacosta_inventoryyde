import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  productName!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
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
}

