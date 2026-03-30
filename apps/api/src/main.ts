import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import fastifyCors from '@fastify/cors';

import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import compression from '@fastify/compress';
import helmet from '@fastify/helmet';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 50 * 1024 * 1024, // 50MB 解决大型文档/Base64图片保存时的 413 Payload Too Large 问题
    }),
  );

  // 注册 Fastify CORS 插件
  await app.register(fastifyCors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // 使用 Pino 结构化日志
  app.useLogger(app.get(Logger));

  // 安全 Headers（XSS / 点击劫持 / MIME 嗅探防护）
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', process.env.MINIO_PUBLIC_ENDPOINT || 'http://localhost:9000'],
        connectSrc: [
          "'self'",
          process.env.FRONTEND_URL || 'http://localhost:3000',
          `ws://${process.env.REDIS_HOST || 'localhost'}:${process.env.COLLAB_PORT || '1234'}`,
          `wss://${process.env.REDIS_HOST || 'localhost'}:${process.env.COLLAB_PORT || '1234'}`,
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // 允许加载外部图片（MinIO）
  });

  // 注册压缩插件以解决过大 payload
  await app.register(compression, { encodings: ['gzip', 'deflate'] });

  // 注册 @fastify/multipart 用于文件上传
  // 全局限制 20MB（附件上传），各 endpoint 内部各自校验更严格的限制
  await app.register(multipart, {
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB
    },
  });

  // 注册 @fastify/static 用于静态文件服务
  await app.register(fastifyStatic, {
    root: join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
    decorateReply: false, // 避免装饰器冲突
  });

  // Swagger API 文档配置
  const config = new DocumentBuilder()
    .setTitle('DocStudio API')
    .setDescription('DocStudio - 实时协作文档平台 API 文档')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: '输入 JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', '认证相关接口')
    .addTag('users', '用户管理')
    .addTag('spaces', '空间管理')
    .addTag('documents', '文档管理')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  // 优雅关闭 — 收到 SIGTERM/SIGINT 时先排空连接再退出
  app.enableShutdownHooks();

  await app.listen({
    port: Number(process.env.PORT) || 3001,
    host: '0.0.0.0',
  });

  const logger = app.get(Logger);
  logger.log(
    `Application is running on: http://localhost:${process.env.PORT || 3001}`,
  );
  logger.log(
    `Swagger API docs: http://localhost:${process.env.PORT || 3001}/api/docs`,
  );
}
void bootstrap();
