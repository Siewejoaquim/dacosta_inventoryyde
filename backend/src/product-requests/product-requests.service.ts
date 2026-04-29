import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductRequestDto } from './dto/create-product-request.dto';

@Injectable()
export class ProductRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductRequestDto, userId: string) {
    return this.prisma.productRequest.create({
      data: { ...dto, loggedById: userId },
      include: { loggedBy: { select: { name: true } } },
    });
  }

  async findAll() {
    return this.prisma.productRequest.findMany({
      include: {
        loggedBy: { select: { name: true } },
        fulfilledByProduct: { select: { productName: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findPending() {
    return this.prisma.productRequest.findMany({
      where: { status: 'PENDING' },
      include: { loggedBy: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async fulfill(requestId: string, productId?: string) {
    const request = await this.prisma.productRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Product request not found');

    return this.prisma.productRequest.update({
      where: { id: requestId },
      data: {
        status: 'FULFILLED',
        ...(productId ? { fulfilledByProductId: productId } : {}),
      },
      include: { loggedBy: { select: { name: true } } },
    });
  }

  async autoFulfill(productName: string, productId: string) {
    await this.prisma.productRequest.updateMany({
      where: {
        status: 'PENDING',
        productName: { contains: productName, mode: 'insensitive' },
      },
      data: { status: 'FULFILLED', fulfilledByProductId: productId },
    });
  }
}
