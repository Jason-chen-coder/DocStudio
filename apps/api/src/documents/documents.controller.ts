import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SpacePermissionGuard } from '../common/guards/space-permission.guard';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @UseGuards(JwtAuthGuard, SpacePermissionGuard)
  @Post()
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @Req() req: any,
  ) {
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

  @UseGuards(JwtAuthGuard, SpacePermissionGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, SpacePermissionGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @UseGuards(JwtAuthGuard, SpacePermissionGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
