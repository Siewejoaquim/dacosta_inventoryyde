import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class InvoiceItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Prop({ required: true })
  productName!: string;

  @Prop({ required: true })
  quantity!: number;

  @Prop({ required: true })
  unitPrice!: number;

  @Prop({ required: true })
  totalPrice!: number;
}

export const InvoiceItemSchema = SchemaFactory.createForClass(InvoiceItem);

export type InvoiceStatus = 'PAID' | 'UNPAID' | 'PARTIAL' | 'VOID';

@Schema({ timestamps: { createdAt: 'dateCreated', updatedAt: false } })
export class Invoice extends Document {
  @Prop({ required: true, unique: true })
  invoiceNumber!: string;

  @Prop({ required: true })
  customerName!: string;

  @Prop()
  customerPhone?: string;

  @Prop({ type: [InvoiceItemSchema], default: [] })
  itemsPurchased!: InvoiceItem[];

  @Prop({ required: true })
  totalAmount!: number;

  @Prop()
  originalAmount?: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: String, enum: ['PAID', 'UNPAID', 'PARTIAL', 'VOID'], default: 'UNPAID' })
  status!: InvoiceStatus;

  @Prop({ default: 0 })
  amountPaid!: number;

  @Prop()
  voidedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  voidedBy?: Types.ObjectId;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

