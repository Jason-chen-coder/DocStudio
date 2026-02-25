import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { ShareService } from './share.service';
import { CreateShareDto, VerifyShareDto } from './dto/share.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
}
