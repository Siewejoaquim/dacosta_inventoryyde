import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private readonly productModel: Model<Product>) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const created = new this.productModel(dto);
    return created.save();
  }

  async findAll(params: {
    search?: string;
    category?: string;
    includeArchived?: boolean;
  }): Promise<Product[]> {
    const filter: FilterQuery<Product> = {};
    if (!params.includeArchived) {
      filter.isArchived = { $ne: true };
    }
    if (params.search) {
      filter.productName = { $regex: params.search, $options: 'i' };
    }
    if (params.category) {
      filter.category = params.category;
    }
    return this.productModel.find(filter).exec();
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async remove(id: string): Promise<void> {
    const product = await this.productModel.findByIdAndUpdate(id, { isArchived: true }, { new: true }).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
  }

  async restore(id: string): Promise<Product> {
    const product = await this.productModel.findByIdAndUpdate(id, { isArchived: false }, { new: true }).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async decreaseStock(productId: string, quantity: number): Promise<Product> {
    const product = await this.findById(productId);
    if (product.quantityInStock < quantity) {
      throw new Error('Insufficient stock');
    }
    product.quantityInStock -= quantity;
    return product.save();
  }

  async increaseStock(productId: string, quantity: number): Promise<Product> {
    const product = await this.findById(productId);
    product.quantityInStock += quantity;
    return product.save();
  }

  async countAll(): Promise<number> {
    return this.productModel.countDocuments().exec();
  }

  async findLowStock(threshold?: number): Promise<Product[]> {
    if (threshold !== undefined) {
      return this.productModel.find({ quantityInStock: { $lt: threshold }, isArchived: { $ne: true } }).exec();
    }
    // Use per-product reorderPoint
    return this.productModel.find({
      $expr: { $lt: ['$quantityInStock', '$reorderPoint'] },
      isArchived: { $ne: true },
    }).exec();
  }

  async getCategories(): Promise<string[]> {
    const cats = await this.productModel.distinct('category', { isArchived: { $ne: true } }).exec();
    return cats.sort();
  }

  async findDeadStock(days = 30): Promise<Product[]> {
    // Products not sold in the last X days — we flag by lastUpdated as a proxy
    // The real check is done via invoice data in the reports module,
    // but here we return products with no stock movement (lastUpdated old)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return this.productModel.find({
      isArchived: { $ne: true },
      quantityInStock: { $gt: 0 },
      lastUpdated: { $lt: cutoff },
    }).exec();
  }
}

