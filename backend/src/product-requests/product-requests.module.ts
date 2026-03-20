import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductRequest, ProductRequestSchema } from './schemas/product-request.schema';
import { ProductRequestsService } from './product-requests.service';
import { ProductRequestsController } from './product-requests.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: ProductRequest.name, schema: ProductRequestSchema }])],
  controllers: [ProductRequestsController],
  providers: [ProductRequestsService],
  exports: [ProductRequestsService],
})
export class ProductRequestsModule {}
