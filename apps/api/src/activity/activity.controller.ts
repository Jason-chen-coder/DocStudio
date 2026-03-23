import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('recent-documents')
  @ApiOperation({ summary: '获取当前用户最近访问的文档列表' })
  getRecentDocuments(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const l = limit ? parseInt(limit, 10) : 20;
    const p = page ? parseInt(page, 10) : 1;
    return this.activityService.getRecentDocuments(
      req.user.id,
      l,
      (p - 1) * l,
    );
  }

  @Get('my')
  @ApiOperation({ summary: '获取当前用户的活动流' })
  getMyActivity(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.activityService.getMyActivity(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 30,
    );
  }

  @Get('space/:spaceId')
  @ApiOperation({ summary: '获取空间内的活动流' })
  getSpaceActivity(
    @Param('spaceId') spaceId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.activityService.getSpaceActivity(
      spaceId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 30,
    );
  }

  @Get('space/:spaceId/stats')
  @ApiOperation({ summary: '获取空间统计数据' })
  getSpaceStats(@Param('spaceId') spaceId: string) {
    return this.activityService.getSpaceStats(spaceId);
  }

  @Get('document/:documentId/stats')
  @ApiOperation({ summary: '获取文档阅读统计' })
  getDocumentStats(@Param('documentId') documentId: string) {
    return this.activityService.getDocumentStats(documentId);
  }

  @Get('my/stats')
  @ApiOperation({ summary: '获取个人生产力统计' })
  getMyStats(@Req() req: any) {
    return this.activityService.getUserProductivityStats(req.user.id);
  }
}
