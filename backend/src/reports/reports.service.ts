import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private async buildReport(from: Date, to: Date) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const [salesResult, expensesResult, invoicesByStatus, topProducts, lowStock] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { dateCreated: { gte: from, lte: end }, status: { not: 'VOID' } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.expense.aggregate({
        where: { date: { gte: from, lte: end } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.invoice.groupBy({
        by: ['status'],
        where: { dateCreated: { gte: from, lte: end } },
        _count: true,
        _sum: { totalAmount: true },
      }),
      this.prisma.invoiceItem.groupBy({
        by: ['productName'],
        where: { invoice: { dateCreated: { gte: from, lte: end }, status: { not: 'VOID' } } },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 5,
      }),
      this.prisma.$queryRaw<{ productName: string; quantityInStock: number; reorderPoint: number }[]>`
        SELECT "productName", "quantityInStock", "reorderPoint"
        FROM "Product"
        WHERE "isArchived" = false
          AND "quantityInStock" <= "reorderPoint"
        ORDER BY "quantityInStock" ASC
        LIMIT 10
      `,
    ]);

    const totalSales = salesResult._sum.totalAmount ?? 0;
    const totalExpenses = expensesResult._sum.amount ?? 0;

    return {
      from,
      to: end,
      totalSales,
      totalExpenses,
      netProfit: totalSales - totalExpenses,
      invoiceCount: salesResult._count,
      expenseCount: expensesResult._count,
      invoicesByStatus,
      topProducts,
      lowStock,
    };
  }

  async getWeeklyReport(refDate: Date = new Date()) {
    const from = new Date(refDate);
    from.setDate(from.getDate() - from.getDay()); // start of week (Sunday)
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 6);
    return this.buildReport(from, to);
  }

  async getMonthlyReport(refDate: Date = new Date()) {
    const from = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    const to = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
    return this.buildReport(from, to);
  }

  async getCustomReport(from: Date, to: Date) {
    return this.buildReport(from, to);
  }

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalProducts,
      todaySales,
      todayExpenses,
      pendingInvoices,
      pendingRequests,
      recentInvoices,
    ] = await Promise.all([
      this.prisma.product.count({ where: { isArchived: false } }),
      this.prisma.invoice.aggregate({
        where: { dateCreated: { gte: today, lt: tomorrow }, status: { not: 'VOID' } },
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
}
