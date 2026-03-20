import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FastifyRequest } from 'fastify';

/**
 * Fastify 适配的 ThrottlerGuard
 * 默认 ThrottlerGuard 基于 Express，无法直接获取 Fastify 的 req.ip
 */
@Injectable()
export class FastifyThrottlerGuard extends ThrottlerGuard {
  getTracker(req: FastifyRequest): Promise<string> {
    return Promise.resolve(req.ip);
  }
}
