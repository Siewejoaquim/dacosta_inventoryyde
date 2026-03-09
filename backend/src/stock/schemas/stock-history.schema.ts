import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChangeType = 'IN' | 'OUT';

@Schema({ timestamps: { createdAt: 'date', updatedAt: false } })
export class StockHistory extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Prop({ required: true, enum: ['IN', 'OUT'] })
  changeType!: ChangeType;

  @Prop({ required: true })
  quantityChanged!: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;
}

export const StockHistorySchema = SchemaFactory.createForClass(StockHistory);

