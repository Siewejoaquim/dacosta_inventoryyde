import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'date', updatedAt: false } })
export class Expense extends Document {
  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({ required: true })
  category!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  loggedBy!: Types.ObjectId;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
