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

/** Image MIME types that will be processed by Sharp (compressed + WebP + thumbnail) */
const PROCESSABLE_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

/** Image types stored as-is (animated GIF, SVG) */
const PASSTHROUGH_IMAGE_TYPES = [
  'image/gif',
  'image/svg+xml',
];

const ALL_IMAGE_TYPES = [...PROCESSABLE_IMAGE_TYPES, ...PASSTHROUGH_IMAGE_TYPES];

/** Allowed attachment MIME types */
const ATTACHMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'application/gzip',
  'application/x-tar',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
];

/** Max file size: images 5MB, attachments 20MB */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * POST /files/upload
   * Upload an image file. Raster images (jpg/png/webp) are auto-compressed to WebP with thumbnail.
   * GIF and SVG are stored as-is.
   */
  @Post('upload')
  async uploadImage(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    if (!req.isMultipart()) {
      throw new HttpException('Request is not multipart', HttpStatus.BAD_REQUEST);
    }

    try {
      const data: MultipartFile | undefined = await req.file();
      if (!data) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      // Validate image type
      if (!ALL_IMAGE_TYPES.includes(data.mimetype)) {
        throw new HttpException(
          `Invalid image type: ${data.mimetype}. Allowed: jpg, png, webp, gif, svg`,
          HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        );
      }

      const buffer = await data.toBuffer();

      // Validate size
      if (buffer.length > MAX_IMAGE_SIZE) {
        throw new HttpException(
          `Image too large (${Math.round(buffer.length / 1024 / 1024)}MB). Max: 5MB`,
          HttpStatus.PAYLOAD_TOO_LARGE,
        );
      }

      const result = await this.filesService.uploadImage({
        buffer,
        originalname: data.filename,
        mimetype: data.mimetype,
      });

      return res.status(HttpStatus.OK).send(result);
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      const err = error as Error;
      throw new HttpException(
        err.message || 'Upload failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /files/upload-attachment
   * Upload a generic attachment (pdf, doc, xlsx, zip, etc.)
   */
  @Post('upload-attachment')
  async uploadAttachment(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    if (!req.isMultipart()) {
      throw new HttpException('Request is not multipart', HttpStatus.BAD_REQUEST);
    }

    try {
      const data: MultipartFile | undefined = await req.file({
        limits: { fileSize: MAX_ATTACHMENT_SIZE },
      });
      if (!data) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      // Validate type
      if (!ATTACHMENT_TYPES.includes(data.mimetype)) {
        throw new HttpException(
          `Unsupported file type: ${data.mimetype}`,
          HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        );
      }

      const buffer = await data.toBuffer();

      // Validate size
      if (buffer.length > MAX_ATTACHMENT_SIZE) {
        throw new HttpException(
          `File too large (${Math.round(buffer.length / 1024 / 1024)}MB). Max: 20MB`,
          HttpStatus.PAYLOAD_TOO_LARGE,
        );
      }

      const result = await this.filesService.uploadAttachment({
        buffer,
        originalname: data.filename,
        mimetype: data.mimetype,
      });

      return res.status(HttpStatus.OK).send(result);
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      const err = error as Error;
      throw new HttpException(
        err.message || 'Upload failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
