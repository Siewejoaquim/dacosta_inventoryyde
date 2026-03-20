import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  create(@Body() dto: CreateExpenseDto, @Req() req: any) {
    return this.expensesService.create(dto, req.user.userId);
  }

  @Get('today')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  today() {
    return this.expensesService.findToday();
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query('from') from: string, @Query('to') to: string) {
    const start = from ? new Date(from) : new Date(new Date().setDate(1));
    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);
    return this.expensesService.findByDateRange(start, end);
  }
}
