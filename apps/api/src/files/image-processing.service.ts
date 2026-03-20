import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

export interface ProcessedImage {
  /** Compressed main image buffer */
  buffer: Buffer;
  /** Thumbnail buffer (200×200 cover) */
  thumbnail: Buffer;
  /** Output format (always webp for raster images) */
  format: string;
  /** MIME type of the output */
  mimetype: string;
  /** Width of the main image */
  width: number;
  /** Height of the main image */
  height: number;
  /** Size in bytes of the main image */
  size: number;
}

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  /** Maximum width/height for the main image */
  private readonly MAX_DIMENSION = 2560;
  /** Quality for WebP compression (1-100) */
  private readonly WEBP_QUALITY = 82;
  /** Thumbnail size */
  private readonly THUMB_SIZE = 200;
  /** Thumbnail quality */
  private readonly THUMB_QUALITY = 70;

  /**
   * Check if a MIME type is a raster image that can be processed by Sharp.
   * SVG and GIF (animated) are excluded – they are stored as-is.
   */
  isProcessableImage(mimetype: string): boolean {
    return ['image/jpeg', 'image/png', 'image/webp'].includes(mimetype);
  }

  /**
   * Process a raster image:
   * 1. Resize if larger than MAX_DIMENSION (preserve aspect ratio)
   * 2. Convert to WebP
   * 3. Generate a 200×200 cover thumbnail
   */
  async processImage(buffer: Buffer): Promise<ProcessedImage> {
    const pipeline = sharp(buffer);
    const metadata = await pipeline.metadata();

    // Resize if exceeds max dimension
    const needsResize =
      (metadata.width && metadata.width > this.MAX_DIMENSION) ||
      (metadata.height && metadata.height > this.MAX_DIMENSION);

    let mainPipeline = sharp(buffer);
    if (needsResize) {
      mainPipeline = mainPipeline.resize(this.MAX_DIMENSION, this.MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to WebP
    const mainBuffer = await mainPipeline
      .webp({ quality: this.WEBP_QUALITY })
      .toBuffer();

    // Get output metadata
    const outputMeta = await sharp(mainBuffer).metadata();

    // Generate thumbnail
    const thumbnail = await sharp(buffer)
      .resize(this.THUMB_SIZE, this.THUMB_SIZE, { fit: 'cover' })
      .webp({ quality: this.THUMB_QUALITY })
      .toBuffer();

    const result: ProcessedImage = {
      buffer: mainBuffer,
      thumbnail,
      format: 'webp',
      mimetype: 'image/webp',
      width: outputMeta.width || 0,
      height: outputMeta.height || 0,
      size: mainBuffer.length,
    };

    this.logger.log(
      `Image processed: ${metadata.width}×${metadata.height} → ${result.width}×${result.height}, ` +
        `${buffer.length} → ${result.size} bytes (${Math.round((1 - result.size / buffer.length) * 100)}% smaller)`,
    );

    return result;
  }
}
