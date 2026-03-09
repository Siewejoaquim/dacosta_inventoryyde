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
  }): Promise<Product[]> {
    const filter: FilterQuery<Product> = {};
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
    const res = await this.productModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException('Product not found');
    }
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

  async findLowStock(threshold = 5): Promise<Product[]> {
    return this.productModel.find({ quantityInStock: { $lt: threshold } }).exec();
  }
}

