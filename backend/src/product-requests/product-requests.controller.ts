import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { ProductRequestsService } from './product-requests.service';
import { CreateProductRequestDto } from './dto/create-product-request.dto';

@Controller('product-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductRequestsController {
  constructor(private readonly service: ProductRequestsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  create(@Body() dto: CreateProductRequestDto, @Req() req: any) {
    return this.service.create(dto, req.user.userId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll() {
    return this.service.findAll();
  }

  @Get('pending')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  pending() {
    return this.service.findPending();
  }
}
