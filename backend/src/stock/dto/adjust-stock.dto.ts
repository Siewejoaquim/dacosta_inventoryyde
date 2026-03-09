import { IsEnum, IsMongoId, IsNumber, Min } from 'class-validator';

export class AdjustStockDto {
  @IsMongoId()
  productId!: string;

  @IsEnum(['IN', 'OUT'])
  changeType!: 'IN' | 'OUT';

  @IsNumber()
  @Min(1)
  quantity!: number;
}

