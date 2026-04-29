import { Body, Controller, Get, Param, Post, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { IsNumber, Min } from 'class-validator';

class UpdatePaymentDto {
  @IsNumber()
  @Min(0)
  amountPaid!: number;
}

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  create(@Body() dto: CreateInvoiceDto, @Req() req: any) {
    return this.invoicesService.create(dto, req.user.userId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll(@Req() req: any) {
    return this.invoicesService.findAll(req.user.userId, req.user.role);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.invoicesService.findById(id, req.user.userId, req.user.role);
  }

  @Patch(':id/payment')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  updatePayment(@Param('id') id: string, @Body() dto: UpdatePaymentDto, @Req() req: any) {
    return this.invoicesService.updatePayment(id, dto.amountPaid, req.user.userId, req.user.role);
  }

  @Patch(':id/void')
  @Roles(UserRole.ADMIN)
  voidInvoice(@Param('id') id: string, @Req() req: any) {
    return this.invoicesService.voidInvoice(id, req.user.userId, req.user.role);
  }
}
