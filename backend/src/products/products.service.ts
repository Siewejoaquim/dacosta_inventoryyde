import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async findAll(opts?: { search?: string; category?: string; includeArchived?: boolean }) {
    return this.prisma.product.findMany({
      where: {
        isArchived: opts?.includeArchived ? undefined : false,
        ...(opts?.search ? { productName: { contains: opts.search, mode: 'insensitive' as const } } : {}),
        ...(opts?.category ? { category: opts.category } : {}),
      },
      orderBy: { productName: 'asc' },
    });
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    try {
      return await this.prisma.product.update({ where: { id }, data: dto });
    } catch {
      throw new NotFoundException('Product not found');
    }
  }

  // archive (soft delete)
  async remove(id: string) {
    try {
      return await this.prisma.product.update({ where: { id }, data: { isArchived: true } });
    } catch {
      throw new NotFoundException('Product not found');
    }
  }

  async restore(id: string) {
    try {
      return await this.prisma.product.update({ where: { id }, data: { isArchived: false } });
    } catch {
      throw new NotFoundException('Product not found');
    }
  }

  async getCategories(): Promise<string[]> {
    const products = await this.prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      where: { isArchived: false },
    });
    return products.map((p) => p.category).filter(Boolean);
  }

  async findDeadStock(days: number = 30) {
    // Products with no invoice items in the last N days
    const since = new Date();
    since.setDate(since.getDate() - days);

    const activeProductIds = await this.prisma.invoiceItem.findMany({
      where: { invoice: { dateCreated: { gte: since } } },
      select: { productId: true },
      distinct: ['productId'],
    });

    const activeIds = activeProductIds.map((p) => p.productId).filter(Boolean) as string[];

    return this.prisma.product.findMany({
      where: {
        isArchived: false,
        id: { notIn: activeIds },
        quantityInStock: { gt: 0 },
      },
      orderBy: { productName: 'asc' },
    });
  }

  async decreaseStock(id: string, quantity: number) {
    const product = await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: { quantityInStock: Math.max(0, product.quantityInStock - quantity) },
    });
  }

  async increaseStock(id: string, quantity: number) {
    return this.prisma.product.update({
      where: { id },
      data: { quantityInStock: { increment: quantity } },
    });
  }
}
