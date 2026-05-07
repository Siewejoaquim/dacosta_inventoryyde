import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class InvoiceItemInput {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  productName?: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  // Per-item guarantee — e.g. "1 semaine", "1 mois", "6 mois", "1 an"
  @IsOptional()
  @IsString()
  @MaxLength(100)
  guarantee?: string;
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

  // Global guarantee for the whole invoice
  @IsOptional()
  @IsString()
  @MaxLength(200)
  guarantee?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemInput)
  items!: InvoiceItemInput[];
}
