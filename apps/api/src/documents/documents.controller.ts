import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { MoveDocumentDto } from './dto/move-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SpacePermissionGuard } from '../common/guards/space-permission.guard';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // ─── 收藏功能（放在 :id 路由之前，避免路由冲突） ───

  @UseGuards(JwtAuthGuard)
  @Get('favorites')
  getFavorites(@Req() req: any) {
    return this.documentsService.getFavorites(req.user.id);
  }

  // ─── 回收站（放在 :id 路由之前） ───

  @UseGuards(JwtAuthGuard, SpacePermissionGuard)
  @Get('trash')
  findTrash(@Query('spaceId') spaceId: string) {
    return this.documentsService.findTrash(spaceId);
  }

  // ─── CRUD ───

  @UseGuards(JwtAuthGuard, SpacePermissionGuard)
  @Post()
  create(@Body() createDocumentDto: CreateDocumentDto, @Req() req: any) {
    return this.documentsService.create(
      req.body.spaceId,
      req.user.id,
      createDocumentDto,
    );
  }

  @UseGuards(JwtAuthGuard, SpacePermissionGuard)
  @Get()
  findAll(@Req() req: any) {
    return this.documentsService.findAll(req.query.spaceId as string);
  }

  /**
   * Lightweight existence check — returns 204 if exists, 404 if not.
   * No body, no side effects (no visit recording).
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/exists')
  @HttpCode(204)
  async checkExists(@Param('id') id: string) {
    const doc = await this.documentsService.exists(id);
    if (!doc) throw new NotFoundException();
  }

  @UseGuards(JwtAuthGuard, SpacePermissionGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.findOne(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, SpacePermissionGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @Req() req: any,
  ) {
    return this.documentsService.update(id, req.user.id, updateDocumentDto);
  }

  @UseGuards(JwtAuthGuard, SpacePermissionGuard)
  @Patch(':id/move')
  move(@Param('id') id: string, @Body() moveDocumentDto: MoveDocumentDto) {
    return this.documentsService.move(id, moveDocumentDto);
  }

  /** 软删除（移至回收站） */
  @UseGuards(JwtAuthGuard, SpacePermissionGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.remove(id, req.user.id);
  }

  /** 恢复文档 */
  @UseGuards(JwtAuthGuard, SpacePermissionGuard)
  @Post(':id/restore')
  restore(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.restore(id, req.user.id);
  }

  /** 永久删除 */
  @UseGuards(JwtAuthGuard, SpacePermissionGuard)
  @Delete(':id/permanent')
  permanentlyDelete(@Param('id') id: string) {
    return this.documentsService.permanentlyDelete(id);
  }

  // ─── 收藏操作 ───

  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  favorite(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.favorite(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/favorite')
  unfavorite(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.unfavorite(id, req.user.id);
  }
}
