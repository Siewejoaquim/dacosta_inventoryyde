import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice } from './schemas/invoice.schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ProductsService } from '../products/products.service';
import { StockService } from '../stock/stock.service';
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<Invoice>,
    private readonly productsService: ProductsService,
    private readonly stockService: StockService,
  ) {}

  private generateInvoiceNumber() {
    const now = new Date();
    return `INV-${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now
      .getTime()
      .toString()
      .slice(-6)}`;
  }

  async create(dto: CreateInvoiceDto, userId: string): Promise<Invoice> {
    const itemsPurchased = [];
    let totalAmount = 0;

    for (const item of dto.items) {
      const product = await this.productsService.findById(item.productId);
      const unitPrice = item.unitPrice ?? product.sellingPrice;
      const totalPrice = unitPrice * item.quantity;
      totalAmount += totalPrice;

      await this.stockService.decreaseStock(item.productId, item.quantity, userId);

      itemsPurchased.push({
        productId: new Types.ObjectId(item.productId),
        productName: item.productName ?? product.productName,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });
    }

    const created = new this.invoiceModel({
      invoiceNumber: this.generateInvoiceNumber(),
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      itemsPurchased,
      totalAmount,
      createdBy: new Types.ObjectId(userId),
    });
    return created.save();
  }

  async findAll(userId?: string): Promise<Invoice[]> {
    const query: any = {};
    if (userId) {
      query.createdBy = new Types.ObjectId(userId);
    }
    return this.invoiceModel
      .find(query)
      .populate('createdBy', 'name username')
      .sort({ dateCreated: -1 })
      .limit(100)
      .exec();
  }

  async findById(id: string, userId?: string, userRole?: string): Promise<Invoice> {
    const invoice = await this.invoiceModel
      .findById(id)
      .populate('createdBy', 'name username')
      .exec();
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    // Staff can only see their own invoices
    if (userRole === UserRole.STAFF && userId && invoice.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only view your own invoices');
    }
    return invoice;
  }

  async totalSalesOn(date: Date): Promise<number> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const result = await this.invoiceModel.aggregate([
      { $match: { dateCreated: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    return result[0]?.total ?? 0;
  }
}

