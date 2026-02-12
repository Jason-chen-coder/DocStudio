
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;
  private readonly logger = new Logger(MinioService.name);
  private readonly bucketName = process.env.MINIO_BUCKET || 'avatars';

  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
  }

  async onModuleInit() {
    await this.createBucketIfNotExists();
  }

  async createBucketIfNotExists() {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1'); // Region is required but often ignored for local MinIO
        
        // Set bucket policy to allow public read access for avatars
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };
        await this.minioClient.setBucketPolicy(
          this.bucketName,
          JSON.stringify(policy),
        );
        
        this.logger.log(`Bucket ${this.bucketName} created successfully with public read policy.`);
      }
    } catch (err: any) {
      this.logger.error(`Error creating bucket ${this.bucketName}: ${err.message}`, err.stack);
      // Don't throw here to avoid crashing the app if MinIO is down, but log error
    }
  }

  async uploadFile(filename: string, fileBuffer: Buffer, mimetype: string) {
    try {
      await this.minioClient.putObject(
        this.bucketName,
        filename,
        fileBuffer,
        fileBuffer.length,
        { 'Content-Type': mimetype },
      );
      
      // Return relative path: bucket/filename
      return `${this.bucketName}/${filename}`;
    } catch (err: any) {
      this.logger.error(`Error uploading file ${filename}: ${err.message}`, err.stack);
      throw err;
    }
  }
}
