import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('weekly')
  weekly(@Query('date') date?: string) {
    const refDate = date ? new Date(date) : new Date();
    return this.reportsService.getWeeklyReport(refDate);
  }

  @Get('monthly')
  monthly(@Query('date') date?: string) {
    const refDate = date ? new Date(date) : new Date();
    return this.reportsService.getMonthlyReport(refDate);
  }

  @Get('custom')
  custom(@Query('from') from: string, @Query('to') to: string) {
    const start = from ? new Date(from) : new Date(new Date().setDate(1));
    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);
    return this.reportsService.getCustomReport(start, end);
  }
}

