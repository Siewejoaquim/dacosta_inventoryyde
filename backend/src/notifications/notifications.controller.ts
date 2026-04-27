import { Controller, Get, Param, Patch, Delete, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getNotifications(@Req() req: any) {
    return this.notificationsService.getUserNotifications(req.user.userId);
  }

  @Get('unread-count')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getUnreadCount(@Req() req: any) {
    const count = await this.notificationsService.getUnreadCount(req.user.userId);
    return { unreadCount: count };
  }

  @Patch(':id/read')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('mark-all-read')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async markAllAsRead(@Req() req: any) {
    await this.notificationsService.markAllAsRead(req.user.userId);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteNotification(@Param('id') id: string) {
    await this.notificationsService.deleteNotification(id);
    return { message: 'Notification deleted' };
  }

  @Delete()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteAllNotifications(@Req() req: any) {
    await this.notificationsService.deleteAllNotifications(req.user.userId);
    return { message: 'All notifications deleted' };
  }
}
