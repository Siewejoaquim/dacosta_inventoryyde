import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationType } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private readonly notificationModel: Model<Notification>,
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedId?: string,
    metadata?: Record<string, any>,
  ): Promise<Notification> {
    return this.notificationModel.create({
      userId: new Types.ObjectId(userId),
      type,
      title,
      message,
      relatedId,
      metadata,
    });
  }

  async getUserNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  async markAsRead(notificationId: string): Promise<Notification | null> {
    return this.notificationModel.findByIdAndUpdate(
      notificationId,
      { isRead: true, readAt: new Date() },
      { new: true },
    );
  }

  async markAllAsRead(userId: string): Promise<any> {
    return this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async deleteNotification(notificationId: string): Promise<Notification | null> {
    return this.notificationModel.findByIdAndDelete(notificationId);
  }

  async deleteAllNotifications(userId: string): Promise<any> {
    return this.notificationModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });
  }

  // Notification triggers
  async notifyLowStock(userId: string, productName: string, currentStock: number, reorderPoint: number): Promise<Notification> {
    return this.createNotification(
      userId,
      NotificationType.LOW_STOCK,
      '📦 Low Stock Alert',
      `${productName} is running low (${currentStock} units, reorder point: ${reorderPoint})`,
      undefined,
      { productName, currentStock, reorderPoint },
    );
  }

  async notifyUnpaidInvoice(userId: string, invoiceNumber: string, customerName: string, amount: number): Promise<Notification> {
    return this.createNotification(
      userId,
      NotificationType.UNPAID_INVOICE,
      '💰 Unpaid Invoice',
      `Invoice #${invoiceNumber} from ${customerName} for Fr ${amount.toLocaleString()} is still unpaid`,
      undefined,
      { invoiceNumber, customerName, amount },
    );
  }

  async notifyProductRequest(userId: string, productName: string, customerName?: string): Promise<Notification> {
    return this.createNotification(
      userId,
      NotificationType.PRODUCT_REQUEST,
      '🔍 New Product Request',
      `${customerName ? `${customerName} requested` : 'New request for'} ${productName}`,
      undefined,
      { productName, customerName },
    );
  }

  async notifyPaymentReceived(userId: string, invoiceNumber: string, customerName: string, amount: number): Promise<Notification> {
    return this.createNotification(
      userId,
      NotificationType.PAYMENT_RECEIVED,
      '✅ Payment Received',
      `Payment of Fr ${amount.toLocaleString()} received for invoice #${invoiceNumber} from ${customerName}`,
      undefined,
      { invoiceNumber, customerName, amount },
    );
  }

  async notifyInvoiceCreated(userId: string, invoiceNumber: string, customerName: string, total: number): Promise<Notification> {
    return this.createNotification(
      userId,
      NotificationType.INVOICE_CREATED,
      '📄 Invoice Created',
      `Invoice #${invoiceNumber} created for ${customerName} - Fr ${total.toLocaleString()}`,
      undefined,
      { invoiceNumber, customerName, total },
    );
  }

  async notifyExpenseLogged(userId: string, description: string, amount: number, category: string): Promise<Notification> {
    return this.createNotification(
      userId,
      NotificationType.EXPENSE_LOGGED,
      '💸 Expense Logged',
      `${category}: ${description} - Fr ${amount.toLocaleString()}`,
      undefined,
      { description, amount, category },
    );
  }
}
