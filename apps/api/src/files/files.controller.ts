import {
  Controller,
  Post,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  async uploadFile(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    if (!req.isMultipart()) {
      throw new HttpException(
        'Request is not multipart',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const data: MultipartFile | undefined = await req.file();
      if (!data) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      // 验证文件大小 (5MB) - approximate check on the truncated payload if needed
      // Actually @fastify/multipart limits this globally via main.ts configure,
      // but we can check if data.file is truncated.
      if (data.file.truncated) {
        throw new HttpException('File too large', HttpStatus.PAYLOAD_TOO_LARGE);
      }

      // 验证类型
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
      ];
      if (!allowedTypes.includes(data.mimetype)) {
        throw new HttpException(
          'Invalid file type',
          HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        );
      }

      const buffer = await data.toBuffer();
      const fileData = {
        buffer,
        originalname: data.filename,
        mimetype: data.mimetype,
      };

      const result = await this.filesService.uploadFile(fileData);
      return res.status(HttpStatus.OK).send(result);
    } catch (error: unknown) {
      const err = error as Error;
      throw new HttpException(
        err.message || 'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
