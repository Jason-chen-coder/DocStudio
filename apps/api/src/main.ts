import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import fastifyCors from '@fastify/cors';

import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // 注册 Fastify CORS 插件
  await app.register(fastifyCors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // 注册 @fastify/multipart 用于文件上传
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
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

  await app.listen({
    port: Number(process.env.PORT) || 3001,
    host: '0.0.0.0',
  });

  console.log(
    `🚀 Application is running on: http://localhost:${process.env.PORT || 3001}`,
  );
  console.log(
    `📚 Swagger API docs: http://localhost:${process.env.PORT || 3001}/api/docs`,
  );
}
void bootstrap();
