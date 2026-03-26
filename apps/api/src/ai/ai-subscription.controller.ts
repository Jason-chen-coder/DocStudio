import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { AiSubscriptionService } from './ai-subscription.service';
import { ApplySubscriptionDto, RejectRequestDto } from './dto/ai-subscription.dto';
import {
  PLAN_COMMANDS,
  PLAN_FEATURES,
  PLAN_DAILY_LIMITS_MONTHLY,
  PLAN_DAILY_LIMITS_YEARLY,
  PLAN_LABELS,
} from './ai-subscription-plan.config';

@ApiTags('ai-subscription')
@ApiBearerAuth()
@Controller('ai/subscription')
export class AiSubscriptionController {
  constructor(private readonly subscriptionService: AiSubscriptionService) {}

  // ── User endpoints ──

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取我的 AI 订阅信息' })
  getMySubscription(@Req() req: any) {
    return this.subscriptionService.getMySubscription(req.user.id);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取我的订阅申请历史' })
  getMyRequests(@Req() req: any) {
    return this.subscriptionService.getMyRequests(req.user.id);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '申请 AI 订阅' })
  apply(@Body() dto: ApplySubscriptionDto, @Req() req: any) {
    return this.subscriptionService.apply(req.user.id, dto);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '取消我的 AI 订阅' })
  cancel(@Req() req: any) {
    return this.subscriptionService.cancel(req.user.id);
  }

  @Get('plans')
  @ApiOperation({ summary: '获取所有套餐信息（无需登录）' })
  getPlans() {
    return ['BASIC', 'VIP', 'MAX'].map((plan) => ({
      plan,
      label: PLAN_LABELS[plan],
      commands: PLAN_COMMANDS[plan],
      features: PLAN_FEATURES[plan],
      dailyLimit: {
        monthly: PLAN_DAILY_LIMITS_MONTHLY[plan],
        yearly: PLAN_DAILY_LIMITS_YEARLY[plan],
      },
    }));
  }

  // ── Admin endpoints ──

  @Get('admin/requests')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '获取待审批的订阅申请' })
  getPendingRequests(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.subscriptionService.getPendingRequests(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('admin/requests/:id/approve')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '审批通过订阅申请' })
  approve(@Param('id') id: string, @Req() req: any) {
    return this.subscriptionService.approve(id, req.user.id);
  }

  @Post('admin/requests/:id/reject')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '拒绝订阅申请' })
  reject(@Param('id') id: string, @Body() dto: RejectRequestDto, @Req() req: any) {
    return this.subscriptionService.reject(id, req.user.id, dto);
  }

  @Get('admin/subscriptions')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '获取所有订阅列表' })
  getAllSubscriptions(
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.subscriptionService.getAllSubscriptions({
      status,
      plan,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Delete('admin/subscriptions/:id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '撤销订阅' })
  revoke(@Param('id') id: string) {
    return this.subscriptionService.revokeSubscription(id);
  }
}
