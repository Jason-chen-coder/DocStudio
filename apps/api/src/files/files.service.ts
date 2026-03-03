import { Injectable, Logger } from '@nestjs/common';
import { MinioService } from '../common/minio/minio.service';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(private readonly minioService: MinioService) {}

  async uploadFile(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  }): Promise<{ url: string }> {
    const ext = path.extname(file.originalname);
    const filename = `${randomUUID()}${ext}`;

    const relativePath = await this.minioService.uploadFile(
      filename,
      file.buffer,
      file.mimetype,
    );

    const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || 'http://localhost:9000';
    // publicEndpoint is expected to be something like http://localhost:9000
    // relativePath is bucket/filename (e.g., avatars/123.png)
    const url = `${publicEndpoint}/${relativePath}`;
    this.logger.log(`File uploaded successfully: ${url}`);
    return { url };
  }
}
