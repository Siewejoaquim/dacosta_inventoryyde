import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationType {
  LOW_STOCK = 'LOW_STOCK',
  UNPAID_INVOICE = 'UNPAID_INVOICE',
  PRODUCT_REQUEST = 'PRODUCT_REQUEST',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  INVOICE_CREATED = 'INVOICE_CREATED',
  EXPENSE_LOGGED = 'EXPENSE_LOGGED',
}

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true })
  type!: NotificationType;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  @Prop()
  relatedId?: string; // ID of related entity (product, invoice, etc.)

  @Prop({ default: false })
  isRead!: boolean;

  @Prop()
  readAt?: Date;

  @Prop({ default: false })
  emailSent!: boolean;

  @Prop()
  metadata?: Record<string, any>; // Additional data like product name, invoice number, etc.
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
