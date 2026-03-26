import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { extname } from 'path';
import { MinioService } from '../common/minio/minio.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly minioService: MinioService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('avatar')
  @UseGuards(AuthGuard('jwt'))
  async uploadAvatar(@Req() req: RequestWithUser) {
    const fastifyReq = req as any;

    // Check if request is multipart
    if (!fastifyReq.isMultipart()) {
      throw new BadRequestException('Request is not multipart');
    }

    const part = await fastifyReq.file();

    if (!part) {
      throw new BadRequestException('File is required');
    }

    // Validate mime type
    if (!part.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed!');
    }

    const fileBuffer = await part.toBuffer();

    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');

    const filename = `${randomName}${extname(part.filename)}`;

    try {
      const fileUrl = await this.minioService.uploadFile(
        filename,
        fileBuffer,
        part.mimetype,
      );
      return this.usersService.updateAvatar(req.user.id, fileUrl);
    } catch (err) {
      throw new BadRequestException('File upload failed');
    }
  }

  @Post('onboarding-complete')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '完成新用户引导' })
  async completeOnboarding(@CurrentUser() user: { id: string }) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { onboardingCompleted: true },
    });
    return { message: '引导完成' };
  }
}
