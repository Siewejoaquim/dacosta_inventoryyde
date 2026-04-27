import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice } from './schemas/invoice.schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ProductsService } from '../products/products.service';
import { StockService } from '../stock/stock.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<Invoice>,
    private readonly productsService: ProductsService,
    private readonly stockService: StockService,
    private readonly notificationsService: NotificationsService,
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
    let calculatedTotal = 0;

    for (const item of dto.items) {
      const product = await this.productsService.findById(item.productId);
      const unitPrice = item.unitPrice ?? product.sellingPrice;
      const totalPrice = unitPrice * item.quantity;
      calculatedTotal += totalPrice;

      await this.stockService.decreaseStock(item.productId, item.quantity, userId);

      itemsPurchased.push({
        productId: new Types.ObjectId(item.productId),
        productName: item.productName ?? product.productName,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });
    }

    const amountPaid = dto.amountPaid ?? 0;
    let status: string = dto.status ?? 'UNPAID';
    // Auto-derive status from amountPaid if not explicitly set
    if (!dto.status) {
      if (amountPaid <= 0) status = 'UNPAID';
      else if (amountPaid >= calculatedTotal) status = 'PAID';
      else status = 'PARTIAL';
    }

    // For PARTIAL: totalAmount = amountPaid (discounted price), originalAmount = calculatedTotal
    const totalAmount = status === 'PARTIAL' ? amountPaid : calculatedTotal;
    const originalAmount = status === 'PARTIAL' ? calculatedTotal : undefined;

    const created = new this.invoiceModel({
      invoiceNumber: this.generateInvoiceNumber(),
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      itemsPurchased,
      totalAmount,
      originalAmount,
      createdBy: new Types.ObjectId(userId),
      status,
      amountPaid,
    });
    const saved = await created.save();

    // Send notification
    await this.notificationsService.notifyInvoiceCreated(
      userId,
      saved.invoiceNumber,
      dto.customerName,
      totalAmount,
    );

    return saved;
  }

  async updatePayment(id: string, amountPaid: number, userId: string, userRole: string): Promise<Invoice> {
    const invoice = await this.findById(id, userId, userRole);
    if (invoice.status === 'VOID') {
      throw new BadRequestException('Cannot update payment on a voided invoice');
    }
    let status: string;
    if (amountPaid <= 0) {
      status = 'UNPAID';
    } else if (amountPaid >= invoice.totalAmount) {
      status = 'PAID';
    } else {
      status = 'PARTIAL';
    }
    const updated = await this.invoiceModel.findByIdAndUpdate(
      id,
      { amountPaid, status },
      { new: true },
    ).populate('createdBy', 'name username').exec();

    // Send notification if payment received
    if (status === 'PAID' || (status === 'PARTIAL' && invoice.status === 'UNPAID')) {
      await this.notificationsService.notifyPaymentReceived(
        userId,
        invoice.invoiceNumber,
        invoice.customerName,
        amountPaid,
      );
    }

    return updated!;
  }

  async voidInvoice(id: string, userId: string, userRole: string): Promise<Invoice> {
    const invoice = await this.findById(id, userId, userRole);
    if (invoice.status === 'VOID') {
      throw new BadRequestException('Invoice is already voided');
    }
    // Restore stock for each item
    for (const item of invoice.itemsPurchased) {
      await this.stockService.increaseStock(item.productId.toString(), item.quantity, userId);
    }
    const updated = await this.invoiceModel.findByIdAndUpdate(
      id,
      { status: 'VOID', voidedAt: new Date(), voidedBy: new Types.ObjectId(userId) },
      { new: true },
    ).populate('createdBy', 'name username').exec();
    return updated!;
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

