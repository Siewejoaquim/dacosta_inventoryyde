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
}

