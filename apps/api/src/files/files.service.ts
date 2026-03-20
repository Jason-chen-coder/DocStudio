import { Injectable, Logger } from '@nestjs/common';
import { MinioService } from '../common/minio/minio.service';
import { ImageProcessingService } from './image-processing.service';
import { randomUUID } from 'crypto';
import * as path from 'path';

interface FileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export interface ImageUploadResult {
  /** URL of the main (compressed) image */
  url: string;
  /** URL of the 200×200 cover thumbnail */
  thumbnail: string;
  /** Width of the main image in pixels */
  width: number;
  /** Height of the main image in pixels */
  height: number;
  /** Size of the main image in bytes */
  size: number;
}

export interface AttachmentUploadResult {
  /** Public URL of the attachment */
  url: string;
  /** Original filename */
  filename: string;
  /** MIME type */
  mimetype: string;
  /** File size in bytes */
  size: number;
}

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly minioService: MinioService,
    private readonly imageProcessing: ImageProcessingService,
  ) {}

  private getPublicUrl(relativePath: string): string {
    const publicEndpoint =
      process.env.MINIO_PUBLIC_ENDPOINT || 'http://localhost:9000';
    return `${publicEndpoint}/${relativePath}`;
  }

  /**
   * Upload an image. Raster images (jpg/png/webp) are compressed to WebP + thumbnail.
   * GIF/SVG are stored as-is (no thumbnail).
   */
  async uploadImage(file: FileInput): Promise<ImageUploadResult> {
    const id = randomUUID();

    if (this.imageProcessing.isProcessableImage(file.mimetype)) {
      // Process raster image: compress + WebP + thumbnail
      const processed = await this.imageProcessing.processImage(file.buffer);

      const mainFilename = `${id}.webp`;
      const thumbFilename = `${id}_thumb.webp`;

      const [mainPath, thumbPath] = await Promise.all([
        this.minioService.uploadFile(mainFilename, processed.buffer, processed.mimetype),
        this.minioService.uploadFile(thumbFilename, processed.thumbnail, processed.mimetype),
      ]);

      this.logger.log(
        `Image uploaded: ${file.originalname} → ${mainFilename} (${processed.width}×${processed.height}, ${processed.size} bytes)`,
      );

      return {
        url: this.getPublicUrl(mainPath),
        thumbnail: this.getPublicUrl(thumbPath),
        width: processed.width,
        height: processed.height,
        size: processed.size,
      };
    }

    // GIF / SVG: store as-is, no thumbnail
    const ext = path.extname(file.originalname) || this.guessExt(file.mimetype);
    const filename = `${id}${ext}`;

    const relativePath = await this.minioService.uploadFile(
      filename,
      file.buffer,
      file.mimetype,
    );

    this.logger.log(`Image (passthrough) uploaded: ${file.originalname} → ${filename}`);

    return {
      url: this.getPublicUrl(relativePath),
      thumbnail: this.getPublicUrl(relativePath), // same as main for GIF/SVG
      width: 0,
      height: 0,
      size: file.buffer.length,
    };
  }

  /**
   * Upload a generic attachment (pdf, docx, xlsx, zip, etc.)
   */
  async uploadAttachment(file: FileInput): Promise<AttachmentUploadResult> {
    const id = randomUUID();
    const ext = path.extname(file.originalname) || this.guessExt(file.mimetype);
    const filename = `attachments/${id}${ext}`;

    const relativePath = await this.minioService.uploadFile(
      filename,
      file.buffer,
      file.mimetype,
    );

    this.logger.log(
      `Attachment uploaded: ${file.originalname} → ${filename} (${file.buffer.length} bytes)`,
    );

    return {
      url: this.getPublicUrl(relativePath),
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.buffer.length,
    };
  }

  // ─── backward compat: old `uploadFile` still works ───

  /** @deprecated Use uploadImage or uploadAttachment instead */
  async uploadFile(file: FileInput): Promise<{ url: string }> {
    const result = await this.uploadImage(file);
    return { url: result.url };
  }

  private guessExt(mimetype: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/svg+xml': '.svg',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/zip': '.zip',
      'text/plain': '.txt',
      'text/csv': '.csv',
      'text/markdown': '.md',
      'application/json': '.json',
    };
    return map[mimetype] || '';
  }
}
