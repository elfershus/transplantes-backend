// src/modules/notifications/notifications.controller.ts
import { Controller, Get, Param, Post, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAllForDoctor(@Request() req) {
    const doctorId = req.user.id;
    return this.notificationsService.findAllForDoctor(doctorId);
  }

  @Get('unread')
  async findUnreadForDoctor(@Request() req) {
    const doctorId = req.user.id;
    return this.notificationsService.findUnreadForDoctor(doctorId);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    const doctorId = req.user.id;
    return this.notificationsService.markAsRead(+id, doctorId);
  }

  @Post('read-all')
  async markAllAsRead(@Request() req) {
    const doctorId = req.user.id;
    await this.notificationsService.markAllAsRead(doctorId);
    return { success: true };
  }
}
