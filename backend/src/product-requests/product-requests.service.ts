import { Injectable, NotFoundException } from '@nestjs/common';
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

  // Manually fulfill a product request
  async fulfill(requestId: string, productId?: string): Promise<ProductRequest> {
    console.log('Service fulfill called with:', { requestId, productId });
    
    try {
      // Validate ObjectId format
      if (!Types.ObjectId.isValid(requestId)) {
        console.error('Invalid ObjectId format:', requestId);
        throw new NotFoundException('Invalid request ID format');
      }

      console.log('Finding request by ID:', requestId);
      const request = await this.model.findById(requestId).exec();
      if (!request) {
        console.error('Request not found:', requestId);
        throw new NotFoundException('Product request not found');
      }

      console.log('Found request:', { id: request._id, status: request.status, productName: request.productName });

      if (request.status === 'FULFILLED') {
        console.log('Request already fulfilled, returning existing');
        return request; // Already fulfilled, just return it
      }

      // Update the request
      console.log('Updating request to FULFILLED');
      const updatedRequest = await this.model.findByIdAndUpdate(
        requestId,
        { 
          status: 'FULFILLED',
          ...(productId && Types.ObjectId.isValid(productId) ? { fulfilledByProduct: new Types.ObjectId(productId) } : {})
        },
        { new: true }
      ).exec();

      if (!updatedRequest) {
        console.error('Failed to update request');
        throw new NotFoundException('Failed to update product request');
      }
      
      console.log('Successfully updated request:', updatedRequest);
      return updatedRequest;
    } catch (error: any) {
      console.error('Service fulfill error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fulfill request: ${error?.message || 'Unknown error'}`);
    }
  }
}
