import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  async decreaseStock(productId: string, quantity: number, userId: string) {
    await this.productsService.decreaseStock(productId, quantity);
    return this.prisma.stockHistory.create({
      data: {
        productId,
        action: 'DECREASE',
        quantity,
        note: `Sold ${quantity} unit(s)`,
        performedById: userId,
      },
    });
  }

  async increaseStock(productId: string, quantity: number, userId: string) {
    await this.productsService.increaseStock(productId, quantity);
    return this.prisma.stockHistory.create({
      data: {
        productId,
        action: 'INCREASE',
        quantity,
        note: `Restocked ${quantity} unit(s)`,
        performedById: userId,
      },
    });
  }

  async adjust(productId: string, quantity: number, note: string, userId: string) {
    await this.prisma.product.update({
      where: { id: productId },
      data: { quantityInStock: quantity },
    });
    return this.prisma.stockHistory.create({
      data: { productId, action: 'ADJUSTMENT', quantity, note, performedById: userId },
    });
  }

  // Called by stock controller
  async findHistory(productId?: string) {
    return this.prisma.stockHistory.findMany({
      where: productId ? { productId } : undefined,
      include: {
        product: { select: { productName: true } },
        performedBy: { select: { name: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  // Alias used by stock controller
  async getHistory(productId?: string) {
    return this.findHistory(productId);
  }
}
