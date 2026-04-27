import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class InvoiceItemInput {
  @IsMongoId()
  productId!: string;

  @IsString()
  @MaxLength(200)
  productName!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class CreateInvoiceDto {
  @IsString()
  @MaxLength(200)
  customerName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  status?: 'PAID' | 'UNPAID' | 'PARTIAL';

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemInput)
  items!: InvoiceItemInput[];
}

