import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense } from './schemas/expense.schema';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(@InjectModel(Expense.name) private readonly expenseModel: Model<Expense>) {}

  async create(dto: CreateExpenseDto, userId: string): Promise<Expense> {
    return this.expenseModel.create({
      ...dto,
      loggedBy: new Types.ObjectId(userId),
    });
  }

  async findToday(): Promise<Expense[]> {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    return this.expenseModel
      .find({ date: { $gte: start, $lte: end } })
      .populate('loggedBy', 'name')
      .sort({ date: -1 })
      .exec();
  }

  async findByDateRange(from: Date, to: Date): Promise<Expense[]> {
    return this.expenseModel
      .find({ date: { $gte: from, $lte: to } })
      .populate('loggedBy', 'name')
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
}
