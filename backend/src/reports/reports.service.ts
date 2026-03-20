import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice } from '../invoices/schemas/invoice.schema';
import { Product } from '../products/schemas/product.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<Invoice>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  private getWeekRange(referenceDate: Date) {
    const date = new Date(referenceDate);
    const day = date.getDay();
    const diffToMonday = (day + 6) % 7;
    const start = new Date(date);
    start.setDate(date.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private getMonthRange(referenceDate: Date) {
    const date = new Date(referenceDate);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  async getWeeklyReport(referenceDate: Date) {
    const { start, end } = this.getWeekRange(referenceDate);
    const invoices = await this.invoiceModel
      .find({ dateCreated: { $gte: start, $lte: end }, status: { $ne: 'VOID' } })
      .exec();

    const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const numberOfInvoices = invoices.length;

    const productCounts: Record<string, { name: string; quantity: number }> = {};
    invoices.forEach((inv) => {
      inv.itemsPurchased.forEach((item) => {
        if (!productCounts[item.productId.toString()]) {
          productCounts[item.productId.toString()] = {
            name: item.productName,
            quantity: 0,
          };
        }
        productCounts[item.productId.toString()].quantity += item.quantity;
      });
    });

    const topSellingProducts = Object.values(productCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const lowStockProducts = await this.productModel
      .find({
        $expr: { $lt: ['$quantityInStock', '$reorderPoint'] },
        isArchived: { $ne: true },
      })
      .exec();

    return {
      totalSales,
      numberOfInvoices,
      topSellingProducts,
      lowStockProducts,
      start,
      end,
    };
  }

  async getMonthlyReport(referenceDate: Date) {
    const { start, end } = this.getMonthRange(referenceDate);
    const invoices = await this.invoiceModel
      .find({ dateCreated: { $gte: start, $lte: end }, status: { $ne: 'VOID' } })
      .exec();

    const totalMonthlyRevenue = invoices.reduce(
      (sum, inv) => sum + inv.totalAmount,
      0,
    );

    let totalProductsSold = 0;
    const productCounts: Record<string, { name: string; quantity: number }> = {};
    invoices.forEach((inv) => {
      inv.itemsPurchased.forEach((item) => {
        totalProductsSold += item.quantity;
        if (!productCounts[item.productId.toString()]) {
          productCounts[item.productId.toString()] = {
            name: item.productName,
            quantity: 0,
          };
        }
        productCounts[item.productId.toString()].quantity += item.quantity;
      });
    });

    const bestSellingProducts = Object.values(productCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const inventoryStatus = await this.productModel
      .find({ isArchived: { $ne: true } })
      .select('productName quantityInStock category reorderPoint')
      .exec();

    return {
      totalMonthlyRevenue,
      totalProductsSold,
      bestSellingProducts,
      inventoryStatus,
      start,
      end,
    };
  }

  async getCustomReport(start: Date, end: Date) {
    const invoices = await this.invoiceModel
      .find({ dateCreated: { $gte: start, $lte: end }, status: { $ne: 'VOID' } })
      .exec();

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    let totalProductsSold = 0;
    const productCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};

    invoices.forEach((inv) => {
      inv.itemsPurchased.forEach((item) => {
        totalProductsSold += item.quantity;
        if (!productCounts[item.productId.toString()]) {
          productCounts[item.productId.toString()] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        productCounts[item.productId.toString()].quantity += item.quantity;
        productCounts[item.productId.toString()].revenue += item.totalPrice;
      });
    });

    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      totalRevenue,
      totalProductsSold,
      numberOfInvoices: invoices.length,
      topProducts,
      start,
      end,
    };
  }
}

