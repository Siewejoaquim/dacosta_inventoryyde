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
