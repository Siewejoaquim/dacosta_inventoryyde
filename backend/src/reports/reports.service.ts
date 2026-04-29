import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalProducts,
      lowStockProducts,
      todaySales,
      todayExpenses,
      pendingInvoices,
      pendingRequests,
      recentInvoices,
    ] = await Promise.all([
      this.prisma.product.count({ where: { isArchived: false } }),
      this.prisma.product.count({
        where: { isArchived: false, quantityInStock: { lt: this.prisma.product.fields.reorderPoint as any } },
      }),
      this.prisma.invoice.aggregate({
        where: { dateCreated: { gte: today, lt: tomorrow } },
        _sum: { totalAmount: true },
      }),
      this.prisma.expense.aggregate({
        where: { date: { gte: today, lt: tomorrow } },
        _sum: { amount: true },
      }),
      this.prisma.invoice.count({ where: { status: { in: ['UNPAID', 'PARTIAL'] } } }),
      this.prisma.productRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.invoice.findMany({
        take: 5,
        orderBy: { dateCreated: 'desc' },
        include: { createdBy: { select: { name: true } } },
      }),
    ]);

    return {
      totalProducts,
      todaySales: todaySales._sum.totalAmount ?? 0,
      todayExpenses: todayExpenses._sum.amount ?? 0,
      pendingInvoices,
      pendingRequests,
      recentInvoices,
    };
  }

  async getSummary(from: Date, to: Date) {
    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);

    const [salesResult, expensesResult, invoicesByStatus, topProducts] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { dateCreated: { gte: from, lte: endDate }, status: { not: 'VOID' } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.expense.aggregate({
        where: { date: { gte: from, lte: endDate } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.invoice.groupBy({
        by: ['status'],
        where: { dateCreated: { gte: from, lte: endDate } },
        _count: true,
        _sum: { totalAmount: true },
      }),
      this.prisma.invoiceItem.groupBy({
        by: ['productName'],
        where: { invoice: { dateCreated: { gte: from, lte: endDate }, status: { not: 'VOID' } } },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 5,
      }),
    ]);

    const totalSales = salesResult._sum.totalAmount ?? 0;
    const totalExpenses = expensesResult._sum.amount ?? 0;

    return {
      totalSales,
      totalExpenses,
      netProfit: totalSales - totalExpenses,
      invoiceCount: salesResult._count,
      expenseCount: expensesResult._count,
      invoicesByStatus,
      topProducts,
    };
  }
}
