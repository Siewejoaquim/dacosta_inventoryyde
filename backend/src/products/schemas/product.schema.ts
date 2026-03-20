import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: 'dateAdded', updatedAt: 'lastUpdated' } })
export class Product extends Document {
  @Prop({ required: true })
  productName!: string;

  @Prop({ required: true })
  category!: string;

  @Prop()
  supplier?: string;

  @Prop({ required: true, min: 0 })
  quantityInStock!: number;

  @Prop({ required: true, min: 0 })
  purchasePrice!: number;

  @Prop({ required: true, min: 0 })
  sellingPrice!: number;

  @Prop({ min: 0, default: 5 })
  reorderPoint!: number;

  @Prop({ default: false })
  isArchived!: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

