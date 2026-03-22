import {
  Controller,
  Get,
  Patch,
  Delete,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { JwtService } from '@nestjs/jwt';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import type { FastifyReply, FastifyRequest } from 'fastify';

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * SSE 实时推送端点
   * 使用 query 参数传递 JWT token（浏览器 EventSource 不支持自定义 Header）
   */
  @Get('sse')
  async sse(
    @Query('token') token: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    // 手动验证 JWT token
    if (!token) {
      reply.status(401).send({ message: 'Missing token' });
      return;
    }

    let payload: { sub: string };
    try {
      payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      reply.status(401).send({ message: 'Invalid token' });
      return;
    }

    const userId = payload.sub;

    // SSE 使用 reply.raw 绕过了 Fastify 的 CORS 中间件，需要手动添加 CORS headers
    const origin = process.env.FRONTEND_URL || 'http://localhost:3000';

    // 设置 SSE headers（含 CORS）
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    });

    // 发送初始连接确认
    reply.raw.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // SSE 回调函数
    const callback = (data: any) => {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // 注册 SSE 客户端
    this.notificationsService.addSseClient(userId, callback);

    // 心跳保活（每 30 秒）
    const heartbeat = setInterval(() => {
      reply.raw.write(': heartbeat\n\n');
    }, 30000);

    // 连接关闭时清理
    req.raw.on('close', () => {
      clearInterval(heartbeat);
      this.notificationsService.removeSseClient(userId, callback);
    });
  }

  /**
   * 获取通知列表
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  getNotifications(
    @CurrentUser() user: any,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationsService.getNotifications(user.id, {
      page: query.page,
      limit: query.limit,
      unreadOnly: query.unreadOnly,
      type: query.type,
    });
  }

  /**
   * 获取未读通知数量
   */
  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  /**
   * 标记单条通知已读
   */
  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  /**
   * 标记全部已读
   */
  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  /**
   * 删除单条通知
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteNotification(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.deleteNotification(user.id, id);
  }

  /**
   * 清除所有已读通知
   */
  @Delete('clear-read')
  @UseGuards(JwtAuthGuard)
  clearRead(@CurrentUser() user: any) {
    return this.notificationsService.clearRead(user.id);
  }

  /**
   * 获取通知偏好设置
   */
  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  getPreferences(@CurrentUser() user: any) {
    return this.notificationsService.getPreferences(user.id);
  }

  /**
   * 更新通知偏好设置
   */
  @Put('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: any,
    @Body() dto: UpdatePreferenceDto,
  ) {
    return this.notificationsService.updatePreferences(
      user.id,
      dto.preferences,
    );
  }

  /**
   * 清理旧通知（仅超级管理员）
   */
  @Delete('cleanup')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  cleanup() {
    return this.notificationsService.cleanupOldNotifications();
  }
}
