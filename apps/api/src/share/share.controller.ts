import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { ShareService } from './share.service';
import { CreateShareDto, VerifyShareDto } from './dto/share.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() createShareDto: CreateShareDto) {
    return this.shareService.create(req.user.id, createShareDto);
  }

  @Get(':token')
  getShareInfo(@Param('token') token: string) {
    return this.shareService.getShareInfo(token);
  }

  /**
   * 验证分享密码 — 限流 5次/5分钟/IP 防暴力破解
   */
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @Post(':token/verify')
  verifyPassword(
    @Param('token') token: string,
    @Body() verifyShareDto: VerifyShareDto,
  ) {
    return this.shareService.verifyPassword(token, verifyShareDto.password);
  }

  @Get(':token/content')
  getContent(
    @Param('token') token: string,
    @Headers('authorization') authHeader: string,
  ) {
    const accessToken = authHeader?.split(' ')[1];
    return this.shareService.getContent(token, accessToken);
  }

  /**
   * 获取某文档的所有分享链接
   */
  @UseGuards(JwtAuthGuard)
  @Get('doc/:docId/list')
  getSharesByDocument(@Req() req: any, @Param('docId') docId: string) {
    return this.shareService.getSharesByDocument(docId, req.user.id);
  }

  /**
   * 删除分享链接
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':shareId')
  deleteShare(@Req() req: any, @Param('shareId') shareId: string) {
    return this.shareService.deleteShare(shareId, req.user.id);
  }
}
