import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense } from './schemas/expense.schema';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(@InjectModel(Expense.name) private readonly expenseModel: Model<Expense>) {}

  async create(dto: CreateExpenseDto, userId: string): Promise<Expense> {
    return this.expenseModel.create({
      ...dto,
      loggedBy: new Types.ObjectId(userId),
    });
  }

  async update(id: string, dto: UpdateExpenseDto, userId: string, userRole: string): Promise<Expense> {
    const expense = await this.expenseModel.findById(id).exec();
    if (!expense) throw new NotFoundException('Expense not found');
    // Staff can only edit their own expenses
    if (userRole === 'STAFF' && expense.loggedBy.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own expenses');
    }
    Object.assign(expense, dto);
    return expense.save();
  }

  async findToday(): Promise<Expense[]> {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    return this.expenseModel
      .find({ date: { $gte: start, $lte: end } })
      .populate('loggedBy', 'name _id')
      .sort({ date: -1 })
      .exec();
  }

  async findByDateRange(from: Date, to: Date): Promise<Expense[]> {
    return this.expenseModel
      .find({ date: { $gte: from, $lte: to } })
      .populate('loggedBy', 'name _id')
      .sort({ date: -1 })
      .exec();
  }

  async totalToday(): Promise<number> {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const result = await this.expenseModel.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total ?? 0;
  }

  async totalForRange(from: Date, to: Date): Promise<number> {
    const result = await this.expenseModel.aggregate([
      { $match: { date: { $gte: from, $lte: to } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total ?? 0;
  }

  async summaryByPeriod(period: 'monthly' | '6months' | 'yearly' | 'custom', from?: Date, to?: Date) {
    let start: Date;
    let end: Date = new Date();
    end.setHours(23, 59, 59, 999);

    if (period === 'monthly') {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
    } else if (period === '6months') {
      start = new Date();
      start.setMonth(start.getMonth() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'yearly') {
      start = new Date(end.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
    } else {
      start = from ?? new Date(end.getFullYear(), end.getMonth(), 1);
      if (to) end = to;
    }

    const expenses = await this.expenseModel
      .find({ date: { $gte: start, $lte: end } })
      .populate('loggedBy', 'name _id')
      .sort({ date: -1 })
      .exec();

    const total = expenses.reduce((s, e) => s + e.amount, 0);

    // Group by category
    const byCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    });

    return { total, byCategory, expenses, start, end };
  }
}
