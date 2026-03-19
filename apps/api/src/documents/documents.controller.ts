import {
  Controller,
  Get,
  Head,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
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

  @UseGuards(JwtAuthGuard, SpacePermissionGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.remove(id, req.user.id);
  }
}
