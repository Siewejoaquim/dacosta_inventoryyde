import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'date', updatedAt: false } })
export class ProductRequest extends Document {
  @Prop({ required: true })
  productName!: string;

  @Prop()
  description?: string;

  @Prop()
  customerName?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  loggedBy!: Types.ObjectId;

  @Prop({ type: String, enum: ['PENDING', 'FULFILLED'], default: 'PENDING' })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  fulfilledByProduct?: Types.ObjectId;
}

export const ProductRequestSchema = SchemaFactory.createForClass(ProductRequest);
