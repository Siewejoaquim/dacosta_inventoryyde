import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
  ) {}

  private generateInvoiceNumber() {
    const now = new Date();
    return `INV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getTime().toString().slice(-6)}`;
  }

  async create(dto: CreateInvoiceDto, userId: string) {
    let calculatedTotal = 0;
    const itemsData = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

      const unitPrice = item.unitPrice ?? product.sellingPrice;
      const totalPrice = unitPrice * item.quantity;
      calculatedTotal += totalPrice;

      await this.stockService.decreaseStock(item.productId, item.quantity, userId);

      itemsData.push({
        productId: item.productId,
        productName: item.productName ?? product.productName,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        guarantee: item.guarantee ?? null,
      });
    }

    const amountPaid = dto.amountPaid ?? 0;
    let status = dto.status ?? 'UNPAID';
    if (!dto.status) {
      if (amountPaid <= 0) status = 'UNPAID';
      else if (amountPaid >= calculatedTotal) status = 'PAID';
      else status = 'PARTIAL';
    }

    const totalAmount = status === 'PARTIAL' ? amountPaid : calculatedTotal;
    const originalAmount = status === 'PARTIAL' ? calculatedTotal : null;

    return this.prisma.invoice.create({
      data: {
        invoiceNumber: this.generateInvoiceNumber(),
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        totalAmount,
        originalAmount,
        amountPaid,
        status: status as any,
        guarantee: dto.guarantee ?? null,
        createdById: userId,
        items: { create: itemsData },
      },
      include: {
        createdBy: { select: { name: true, username: true } },
        items: true,
      },
    });
  }

  async findAll(userId?: string, userRole?: string) {
    return this.prisma.invoice.findMany({
      where: userRole === 'STAFF' && userId ? { createdById: userId } : undefined,
      include: {
        createdBy: { select: { id: true, name: true, username: true } },
        items: true,
      },
      orderBy: { dateCreated: 'desc' },
      take: 100,
    });
  }

  async findById(id: string, userId?: string, userRole?: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, username: true } },
        items: { include: { product: { select: { productName: true } } } },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (userRole === 'STAFF' && userId && invoice.createdById !== userId) {
      throw new ForbiddenException('You can only view your own invoices');
    }
    return invoice;
  }

  async updatePayment(id: string, amountPaid: number, userId: string, userRole: string) {
    const invoice = await this.findById(id, userId, userRole);
    if (invoice.status === 'VOID') throw new BadRequestException('Cannot update a voided invoice');

    let status: string;
    if (amountPaid <= 0) status = 'UNPAID';
    else if (amountPaid >= invoice.totalAmount) status = 'PAID';
    else status = 'PARTIAL';

    return this.prisma.invoice.update({
      where: { id },
      data: { amountPaid, status: status as any },
      include: { createdBy: { select: { name: true, username: true } }, items: true },
    });
  }

  async voidInvoice(id: string, userId: string, userRole: string) {
    const invoice = await this.findById(id, userId, userRole);
    if (invoice.status === 'VOID') throw new BadRequestException('Invoice is already voided');

    for (const item of invoice.items) {
      if (item.productId) {
        await this.stockService.increaseStock(item.productId, item.quantity, userId);
      }
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'VOID', voidedAt: new Date(), voidedById: userId },
      include: { createdBy: { select: { name: true, username: true } }, items: true },
    });
  }

  async totalSalesOn(date: Date): Promise<number> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const result = await this.prisma.invoice.aggregate({
      where: { dateCreated: { gte: start, lte: end } },
      _sum: { totalAmount: true },
    });
    return result._sum.totalAmount ?? 0;
  }
}
