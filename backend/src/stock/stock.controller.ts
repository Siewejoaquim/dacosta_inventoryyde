import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { StockService } from './stock.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Controller('stock')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('increase')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  increase(@Body() dto: AdjustStockDto, @Req() req: any) {
    return this.stockService.increaseStock(dto.productId, dto.quantity, req.user.userId);
  }

  @Post('reduce')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  reduce(@Body() dto: AdjustStockDto, @Req() req: any) {
    return this.stockService.decreaseStock(dto.productId, dto.quantity, req.user.userId);
  }

  @Get('history')
  @Roles(UserRole.ADMIN)
  history() {
    return this.stockService.findHistory();
  }
}

