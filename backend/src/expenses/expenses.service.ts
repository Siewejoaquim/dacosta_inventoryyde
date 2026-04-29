import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateExpenseDto, userId: string) {
    return this.prisma.expense.create({
      data: { ...dto, loggedById: userId },
      include: { loggedBy: { select: { name: true, username: true } } },
    });
  }

  async findAll() {
    return this.prisma.expense.findMany({
      include: { loggedBy: { select: { name: true, username: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async findById(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: { loggedBy: { select: { name: true, username: true } } },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async findToday() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return this.prisma.expense.findMany({
      where: { date: { gte: start, lte: end } },
      include: { loggedBy: { select: { name: true, username: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async findByDateRange(from: Date, to: Date) {
    return this.prisma.expense.findMany({
      where: { date: { gte: from, lte: to } },
      include: { loggedBy: { select: { name: true, username: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async summaryByPeriod(
    period: 'monthly' | '6months' | 'yearly' | 'custom',
    from?: Date,
    to?: Date,
  ) {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);
    end.setHours(23, 59, 59, 999);

    if (period === 'custom' && from && to) {
      start = from;
      end = to;
    } else if (period === 'yearly') {
      start = new Date(now.getFullYear(), 0, 1);
    } else if (period === '6months') {
      start = new Date(now);
      start.setMonth(start.getMonth() - 6);
    } else {
      // monthly
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const expenses = await this.prisma.expense.findMany({
      where: { date: { gte: start, lte: end } },
      include: { loggedBy: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });

    const byCategory = expenses.reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    return { expenses, byCategory, total, from: start, to: end };
  }

  async update(id: string, dto: Partial<CreateExpenseDto>, userId: string, userRole: string) {
    const expense = await this.findById(id);
    if (userRole !== 'ADMIN' && expense.loggedById !== userId) {
      throw new ForbiddenException('You can only edit your own expenses');
    }
    return this.prisma.expense.update({
      where: { id },
      data: dto,
      include: { loggedBy: { select: { name: true, username: true } } },
    });
  }

  async delete(id: string) {
    try {
      return await this.prisma.expense.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Expense not found');
    }
  }

  async totalExpensesOn(date: Date): Promise<number> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const result = await this.prisma.expense.aggregate({
      where: { date: { gte: start, lte: end } },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }
}
