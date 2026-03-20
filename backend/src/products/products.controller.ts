import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('categories')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  getCategories() {
    return this.productsService.getCategories();
  }

  @Get('dead-stock')
  @Roles(UserRole.ADMIN)
  deadStock(@Query('days') days?: string) {
    return this.productsService.findDeadStock(days ? Number(days) : 30);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.productsService.findAll({ search, category, includeArchived: includeArchived === 'true' });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id/restore')
  @Roles(UserRole.ADMIN)
  restore(@Param('id') id: string) {
    return this.productsService.restore(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
