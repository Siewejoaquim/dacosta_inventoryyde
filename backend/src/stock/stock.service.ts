import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductsService } from '../products/products.service';
import { StockHistory } from './schemas/stock-history.schema';

@Injectable()
export class StockService {
  constructor(
    @InjectModel(StockHistory.name)
    private readonly stockHistoryModel: Model<StockHistory>,
    private readonly productsService: ProductsService,
  ) {}

  async increaseStock(productId: string, quantity: number, userId: string) {
    const product = await this.productsService.increaseStock(productId, quantity);
    await this.stockHistoryModel.create({
      productId: new Types.ObjectId(productId),
      changeType: 'IN',
      quantityChanged: quantity,
      userId: new Types.ObjectId(userId),
    });
    return product;
  }

  async decreaseStock(productId: string, quantity: number, userId: string) {
    const product = await this.productsService.decreaseStock(productId, quantity);
    await this.stockHistoryModel.create({
      productId: new Types.ObjectId(productId),
      changeType: 'OUT',
      quantityChanged: quantity,
      userId: new Types.ObjectId(userId),
    });
    return product;
  }

  async findHistory() {
    return this.stockHistoryModel
      .find()
      .populate('productId', 'productName')
      .populate('userId', 'name username')
      .sort({ date: -1 })
      .limit(100)
      .exec();
  }
}

