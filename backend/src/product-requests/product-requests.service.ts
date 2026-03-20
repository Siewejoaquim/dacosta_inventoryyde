import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductRequest } from './schemas/product-request.schema';
import { CreateProductRequestDto } from './dto/create-product-request.dto';

@Injectable()
export class ProductRequestsService {
  constructor(
    @InjectModel(ProductRequest.name) private readonly model: Model<ProductRequest>,
  ) {}

  async create(dto: CreateProductRequestDto, userId: string): Promise<ProductRequest> {
    return this.model.create({ ...dto, loggedBy: new Types.ObjectId(userId) });
  }

  async findAll(): Promise<ProductRequest[]> {
    return this.model
      .find()
      .populate('loggedBy', 'name')
      .populate('fulfilledByProduct', 'productName')
      .sort({ date: -1 })
      .exec();
  }

  async findPending(): Promise<ProductRequest[]> {
    return this.model
      .find({ status: 'PENDING' })
      .populate('loggedBy', 'name')
      .sort({ date: -1 })
      .exec();
  }

  // Called when a new product is created — auto-fulfills matching pending requests
  async autoFulfill(productName: string, productId: string): Promise<void> {
    const regex = new RegExp(productName, 'i');
    await this.model.updateMany(
      { status: 'PENDING', productName: { $regex: regex } },
      { status: 'FULFILLED', fulfilledByProduct: new Types.ObjectId(productId) },
    );
  }
}
