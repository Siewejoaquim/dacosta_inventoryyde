import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

function parseDate(str: string | undefined, fallback: Date): Date {
  if (!str) return fallback;
  const d = new Date(str);
  if (isNaN(d.getTime())) throw new BadRequestException(`Invalid date format: "${str}"`);
  return d;
}

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  create(@Body() dto: CreateExpenseDto, @Req() req: any) {
    return this.expensesService.create(dto, req.user.userId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  update(@Param('id') id: string, @Body() dto: UpdateExpenseDto, @Req() req: any) {
    return this.expensesService.update(id, dto, req.user.userId, req.user.role);
  }

  @Get('today')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  today() {
    return this.expensesService.findToday();
  }

  @Get('summary')
  @Roles(UserRole.ADMIN)
  summary(
    @Query('period') period: 'monthly' | '6months' | 'yearly' | 'custom' = 'monthly',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.expensesService.summaryByPeriod(
      period,
      from ? parseDate(from, new Date()) : undefined,
      to ? parseDate(to, new Date()) : undefined,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query('from') from: string, @Query('to') to: string) {
    const start = parseDate(from, new Date(new Date().setDate(1)));
    const end = parseDate(to, new Date());
    end.setHours(23, 59, 59, 999);
    return this.expensesService.findByDateRange(start, end);
  }
}
